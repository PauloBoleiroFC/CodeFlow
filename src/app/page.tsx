import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BRANCH_FORMAT } from "@/lib/branch";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await prisma.appSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      branchFormat: DEFAULT_BRANCH_FORMAT,
      defaultBranchType: "task",
    },
  });

  const data = await getDashboardData();
  return <DashboardView data={data} />;
}
