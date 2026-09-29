import { type JSX } from "react";

// Domain-specific hardware and software visual illustrations for the 7 skill categories.
// Designed with dark-luxury glow paths, PMIC/bus trace lines, and crisp SVG geometry.

export function CategoryIllustration({ categoryId }: { categoryId: string }): JSX.Element {
  switch (categoryId) {
    case "languages":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="chipGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="dieCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#090d16" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="70" y="20" width="100" height="80" rx="10" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
          <rect x="85" y="35" width="70" height="50" rx="6" fill="url(#dieCore)" stroke="url(#chipGlow)" strokeWidth="1" />
          {/* Internal Die Gates & Registers */}
          <path d="M 95 45 H 145 M 95 55 H 130 M 95 65 H 140 M 95 75 H 120" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
          <circle cx="140" cy="55" r="3" fill="#fbbf24" />
          <circle cx="132" cy="75" r="2.5" fill="#10b981" />
          {/* Outer Lead Pins */}
          <path d="M 50 40 H 70 M 50 60 H 70 M 50 80 H 70 M 170 40 H 190 M 170 60 H 190 M 170 80 H 190" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <path d="M 90 5 V 20 M 120 5 V 20 M 150 5 V 20 M 90 100 V 115 M 120 100 V 115 M 150 100 V 115" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "platforms":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id="socGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Dual Core Block & FPGA Grid */}
          <rect x="35" y="25" width="75" height="70" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="130" y="25" width="75" height="70" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="72.5" y="55" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ARM Cortex</text>
          <text x="72.5" y="70" fill="#cbd5e1" fontSize="8" fontFamily="monospace" textAnchor="middle">Quad A53</text>
          <text x="167.5" y="55" fill="#fbbf24" fontSize="10" fontFamily="monospace" textAnchor="middle">FPGA / R5</text>
          <text x="167.5" y="70" fill="#cbd5e1" fontSize="8" fontFamily="monospace" textAnchor="middle">Realtime AMP</text>
          {/* Interconnect Bus */}
          <path d="M 110 60 H 130" stroke="url(#socGrad)" strokeWidth="3" strokeDasharray="2 2" />
          <circle cx="120" cy="60" r="4" fill="#38bdf8" />
        </svg>
      );

    case "embedded-os":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          {/* Layered OS Stack Cards */}
          <g transform="translate(45, 15)">
            <rect x="0" y="60" width="150" height="28" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
            <text x="75" y="78" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="middle">U-Boot &amp; Secure Bootloader</text>

            <rect x="10" y="32" width="130" height="28" rx="6" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="75" y="50" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Linux 6.18 LTS / FreeRTOS</text>

            <rect x="20" y="4" width="110" height="28" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
            <text x="75" y="22" fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="middle">Atomic OSTree &amp; Userland</text>
          </g>
        </svg>
      );

    case "protocols":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          {/* Oscilloscope Bus Waveforms */}
          <path d="M 20 40 H 50 L 50 15 H 90 L 90 40 H 130 L 130 15 H 170 L 170 40 H 220" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20 85 H 70 L 70 65 H 110 L 110 85 H 150 L 150 65 H 190 L 190 85 H 220" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {/* Bus Grid lines */}
          <line x1="20" y1="50" x2="220" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <text x="30" y="110" fill="#64748b" fontSize="8" fontFamily="monospace">PCIe Gen4 / CAN-FD / SPI Octal</text>
        </svg>
      );

    case "wireless-rf":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          {/* RF Antenna Tower & Beamforming Concentric Rings */}
          <g transform="translate(120, 75)">
            {/* Antenna Mast */}
            <path d="M 0 0 L -15 35 M 0 0 L 15 35 M -20 35 H 20" stroke="#94a3b8" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#ef4444" />
            {/* RF Waves */}
            <circle cx="0" cy="0" r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.9" />
            <circle cx="0" cy="0" r="36" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
            <circle cx="0" cy="0" r="54" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
          </g>
          <text x="120" y="20" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Wi-Fi 7 / BLE 5.3 / Sat SBD</text>
        </svg>
      );

    case "robotics-ai":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          {/* 3D Tensor Processing Grid & Vector Matrix */}
          <g transform="translate(60, 20)">
            <rect x="0" y="0" width="120" height="80" rx="8" fill="#090d16" stroke="#10b981" strokeWidth="1.5" />
            {/* Neural Matrix Nodes */}
            <circle cx="30" cy="25" r="5" fill="#38bdf8" />
            <circle cx="30" cy="55" r="5" fill="#38bdf8" />
            <circle cx="60" cy="15" r="5" fill="#fbbf24" />
            <circle cx="60" cy="40" r="5" fill="#fbbf24" />
            <circle cx="60" cy="65" r="5" fill="#fbbf24" />
            <circle cx="90" cy="25" r="5" fill="#10b981" />
            <circle cx="90" cy="55" r="5" fill="#10b981" />
            {/* Synapse Lines */}
            <path d="M 30 25 L 60 15 M 30 25 L 60 40 M 30 55 L 60 40 M 30 55 L 60 65 M 60 15 L 90 25 M 60 40 L 90 25 M 60 40 L 90 55 M 60 65 L 90 55" stroke="#334155" strokeWidth="1.2" />
          </g>
        </svg>
      );

    case "tooling-cicd":
      return (
        <svg className="cat-illustration-svg" viewBox="0 0 240 120" fill="none" aria-hidden="true">
          {/* Hardware-in-the-Loop CI/CD Pipeline Flow */}
          <g transform="translate(20, 40)">
            {/* Step 1: Git */}
            <rect x="0" y="0" width="50" height="40" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="25" y="24" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">Git Push</text>

            <path d="M 50 20 H 70" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />

            {/* Step 2: HIL Fixture */}
            <rect x="70" y="0" width="60" height="40" rx="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.2" />
            <text x="100" y="24" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">JTAG Probe</text>

            <path d="M 130 20 H 150" stroke="#475569" strokeWidth="2" strokeDasharray="2 2" />

            {/* Step 3: Test Green */}
            <rect x="150" y="0" width="50" height="40" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
            <text x="175" y="24" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle">Pass 100%</text>
          </g>
        </svg>
      );

    default:
      return <div className="cat-illustration-placeholder" />;
  }
}
