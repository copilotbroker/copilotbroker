import { AdminLayout } from "@/components/admin/AdminLayout";
import { AgendaModule } from "@/components/agenda/AgendaModule";
import { useUserRole } from "@/hooks/use-user-role";

const AdminAgenda = () => {
  const { brokerId } = useUserRole();

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <AgendaModule brokerId={brokerId} isAdmin />
      </div>
    </AdminLayout>
  );
};

export default AdminAgenda;
