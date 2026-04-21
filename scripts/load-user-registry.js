const { performance } = require("perf_hooks");

const BASE_URL = process.env.LOAD_TEST_BASE_URL || "http://localhost:3001";
const TOTAL_REQUESTS = Number(process.env.LOAD_TEST_REQUESTS || 100);
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 10);

function buildWalletAddress(index) {
    const hexPart = index.toString(16).padStart(40, "0");
    return `0x${hexPart}`;
}

async function requestJson(pathname, options = {}) {
    const startedAt = performance.now();
    const response = await fetch(`${BASE_URL}${pathname}`, options);
    const finishedAt = performance.now();

    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${payload?.error || "unknown error"}`
        );
    }

    return {
        payload,
        durationMs: finishedAt - startedAt,
    };
}

function percentile(sortedValues, ratio) {
    if (sortedValues.length === 0) {
        return 0;
    }

    const index = Math.min(
        sortedValues.length - 1,
        Math.floor(sortedValues.length * ratio)
    );

    return sortedValues[index];
}

async function runSingleIteration(index) {
    const walletAddress = buildWalletAddress(index + 1);

    return requestJson("/api/users/upsert", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            walletAddress,
            chainId: "11155111",
            networkName: "sepolia",
            source: "load-test",
        }),
    });
}

async function runPool() {
    const results = [];
    let cursor = 0;

    async function worker() {
        while (cursor < TOTAL_REQUESTS) {
            const currentIndex = cursor;
            cursor += 1;

            try {
                const result = await runSingleIteration(currentIndex);
                results.push({
                    ok: true,
                    durationMs: result.durationMs,
                });
            } catch (error) {
                results.push({
                    ok: false,
                    durationMs: 0,
                    error: error.message || String(error),
                });
            }
        }
    }

    const workers = Array.from(
        { length: Math.min(CONCURRENCY, TOTAL_REQUESTS) },
        () => worker()
    );

    await Promise.all(workers);
    return results;
}

async function main() {
    if (typeof fetch !== "function") {
        throw new Error(
            "Global fetch is unavailable. Use Node.js 18+ for this load test."
        );
    }

    console.log("Checking user registry health...");
    await requestJson("/health");

    console.log(
        `Starting load test for ${BASE_URL} with ${TOTAL_REQUESTS} requests and concurrency ${CONCURRENCY}...`
    );

    const startedAt = performance.now();
    const results = await runPool();
    const finishedAt = performance.now();

    const successful = results.filter((item) => item.ok);
    const failed = results.filter((item) => !item.ok);
    const durations = successful
        .map((item) => item.durationMs)
        .sort((left, right) => left - right);
    const totalDurationMs = finishedAt - startedAt;
    const averageDurationMs =
        durations.length === 0
            ? 0
            : durations.reduce((sum, value) => sum + value, 0) /
              durations.length;

    console.log("\nLoad test completed.");
    console.log(`Successful requests: ${successful.length}`);
    console.log(`Failed requests: ${failed.length}`);
    console.log(`Total wall time: ${totalDurationMs.toFixed(2)} ms`);
    console.log(`Average latency: ${averageDurationMs.toFixed(2)} ms`);
    console.log(`P95 latency: ${percentile(durations, 0.95).toFixed(2)} ms`);
    console.log(`P99 latency: ${percentile(durations, 0.99).toFixed(2)} ms`);

    if (failed.length > 0) {
        console.log("\nFirst error:");
        console.log(failed[0].error);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error("Load test failed:", error);
    process.exit(1);
});
