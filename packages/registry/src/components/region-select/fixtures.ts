import type { ServerRegion } from "./region-select";

/** Neon's AWS regions, matching the console's create-project picker. */
export const neonAwsRegions: ServerRegion[] = [
  {
    id: "aws-us-east-1",
    lat: 38.9,
    lng: -77.4,
    name: "US East 1 (N. Virginia)",
    provider: "AWS",
  },
  {
    id: "aws-us-east-2",
    lat: 40.1,
    lng: -83,
    name: "US East 2 (Ohio)",
    provider: "AWS",
  },
  {
    id: "aws-us-west-2",
    lat: 45.6,
    lng: -121.2,
    name: "US West 2 (Oregon)",
    provider: "AWS",
  },
  {
    id: "aws-ap-southeast-1",
    lat: 1.35,
    lng: 103.82,
    name: "Asia Pacific 1 (Singapore)",
    provider: "AWS",
  },
  {
    id: "aws-ap-southeast-2",
    lat: -33.87,
    lng: 151.21,
    name: "Asia Pacific 2 (Sydney)",
    provider: "AWS",
  },
  {
    id: "aws-eu-central-1",
    lat: 50.11,
    lng: 8.68,
    name: "Europe Central 1 (Frankfurt)",
    provider: "AWS",
  },
  {
    id: "aws-eu-west-2",
    lat: 51.51,
    lng: -0.13,
    name: "Europe West 2 (London)",
    provider: "AWS",
  },
  {
    id: "aws-sa-east-1",
    lat: -23.55,
    lng: -46.63,
    name: "South America East 1 (São Paulo)",
    provider: "AWS",
  },
];
