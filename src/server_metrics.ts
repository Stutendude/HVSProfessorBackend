import express from "express";
import os from "os";
//das script kümmert sich um den port 3001, auf welchen der proxy die metrics anfragen kann um effektives routing zu betreiben
const METRICS_PORT = Number(process.env.METRICS_PORT || 3001);
const app = express();

function getCpuUsagePercent(): number {
    // Best-effort: use loadavg relative to number of CPUs
    const load = os.loadavg()[0]; // 1-min
    const cpus = os.cpus().length || 1;
    const percent = Math.min(100, (load / cpus) * 100);
    return Math.round(percent * 100) / 100; // two decimals
}

app.get("/metrics", (req, res) => {
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const usedPercent = Math.round((memUsed / memTotal) * 10000) / 100;

    const payload = {
        timestamp: new Date().toISOString(),
        loadavg_1m: os.loadavg()[0],
        loadavg_5m: os.loadavg()[1],
        loadavg_15m: os.loadavg()[2],
        cpuPercentApprox: getCpuUsagePercent(),
        mem: {
            total: memTotal,
            free: memFree,
            used: memUsed,
            usedPercent
        },
        cpus: os.cpus().length,
        platform: os.platform(),
        uptime_seconds: os.uptime()
    };
    //TODO:hier kann auch noch ein log hin
    res.json(payload);
});

app.listen(METRICS_PORT, () => {
    //TODO: loggen
    console.log(`Metrics server listening on port ${METRICS_PORT}`);
});
