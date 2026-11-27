import RewardsAdminClient from "./rewards-client";

export const instant = false;

export const metadata = {
  title: "Recompensas · comidasTop Admin",
};

export default function RewardsAdminPage() {
  return <RewardsAdminClient />;
}
