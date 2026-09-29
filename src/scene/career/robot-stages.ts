// 3D Robot Evolution Stages for the Career Timeline:
// From a simple 2-wheel wall-follower bot to a full humanoid Transformer Mech.

export type RobotStageId = 0 | 1 | 2 | 3;

export type RobotStageMeta = {
  id: RobotStageId;
  name: string;
  codename: string;
  era: string;
  description: string;
  specs: string[];
};

export const ROBOT_STAGES: readonly RobotStageMeta[] = [
  {
    id: 0,
    name: "Wall Follower Bot",
    codename: "GEN_01 // TRACE_BOT",
    era: "Early Systems & Microcontrollers",
    description: "Differential drive 2-wheel chassis with IR distance sensor array following wall contours and line paths.",
    specs: ["Dual DC Motors", "IR Proximity Array", "PWM H-Bridge Driver", "Bare-Metal C"],
  },
  {
    id: 1,
    name: "Obstacle Avoider Rover",
    codename: "GEN_02 // ROVER_SCAN",
    era: "Embedded Linux & Sensor Fusion",
    description: "4-wheel all-terrain rover with spinning top LiDAR dome, ultrasonic transducers, and pan-tilt camera head.",
    specs: ["Spinning LiDAR Dome", "Ultrasonic Transducers", "Pan-Tilt Camera", "FreeRTOS / Linux"],
  },
  {
    id: 2,
    name: "Edge AI Systems Mesh",
    codename: "GEN_03 // TENSOR_MESH",
    era: "Multi-Core BSP & NPU Runtimes",
    description: "Articulated quad-leg robotics platform with NPU tensor core, CAN bus telemetry, and low-latency motor nodes.",
    specs: ["Qualcomm NPU Core", "CAN-FD Telemetry", "8-Axis Articulated Legs", "OSTree OTA"],
  },
  {
    id: 3,
    name: "Humanoid Transformer Mech",
    codename: "GEN_04 // OMNI_TRANSFORMER",
    era: "Autonomous Systems & Full Mech",
    description: "Full standing humanoid Transformer Mech assembled from vehicular chassis modules with chest reactor and thrusters.",
    specs: ["Chest Core Reactor", "Visor Optics Array", "Dual Arm Actuators", "Kinematic Thruster Pack"],
  },
];
