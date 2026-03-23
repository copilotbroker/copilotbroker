import { BrokerLayout } from "@/components/broker/BrokerLayout";
import { AgendaModule } from "@/components/agenda/AgendaModule";
import { useUserRole } from "@/hooks/use-user-role";

const BrokerAgenda = () => {
  const { brokerId } = useUserRole();

  return (
    <BrokerLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <AgendaModule brokerId={brokerId} />
      </div>
    </BrokerLayout>
  );
};

export default BrokerAgenda;
