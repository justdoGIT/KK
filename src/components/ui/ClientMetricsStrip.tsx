import { type JSX } from "react";

type MetricItem = {
  value: string;
  label: string;
  subtext: string;
};

const CLIENT_METRICS: MetricItem[] = [
  {
    value: "9+ Years",
    label: "INDUSTRIAL & EMBEDDED MASTERY",
    subtext: "Automotive, industrial IoT, edge AI & robotics",
  },
  {
    value: "4 Major SoCs",
    label: "QUALCOMM • TI • NXP • XILINX",
    subtext: "Full BSP, device trees, and custom bootloader bring-up",
  },
  {
    value: "99.9%",
    label: "FIELD UPTIME & RELIABILITY",
    subtext: "Hardware watchdogs & atomic A/B dual-partition updates",
  },
  {
    value: "128 TOPS",
    label: "EDGE AI NPU ACCELERATION",
    subtext: "Sub-3ms INT8 quantized on-device neural inference",
  },
  {
    value: "< 2.8ms",
    label: "DETERMINISTIC MOTION LOOPS",
    subtext: "Real-time ROS2, EtherCAT & CAN-FD motor actuation",
  },
  {
    value: "Zero Bricking",
    label: "PRODUCTION INVARIANT",
    subtext: "Fail-safe recovery, JTAG diagnostics & signed rootfs",
  },
];

export function ClientMetricsStrip(): JSX.Element {
  return (
    <div className="client-metrics-strip" aria-label="Key engineering metrics">
      <div className="metrics-strip-inner">
        {CLIENT_METRICS.map((item, idx) => (
          <div key={idx} className="metric-strip-card">
            <span className="metric-strip-val">{item.value}</span>
            <span className="metric-strip-label">{item.label}</span>
            <span className="metric-strip-sub">{item.subtext}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
