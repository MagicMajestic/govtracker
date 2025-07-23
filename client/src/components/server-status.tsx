import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serverStatuses = [
  { name: "Government", members: 142, status: "online", color: "bg-green-500" },
  { name: "FIB", members: 89, status: "online", color: "bg-green-500" },
  { name: "LSPD", members: 156, status: "online", color: "bg-green-500" },
  { name: "SANG", members: 67, status: "delay", color: "bg-yellow-500" },
  { name: "LSCSD", members: 94, status: "online", color: "bg-green-500" },
  { name: "EMS", members: 103, status: "online", color: "bg-green-500" },
  { name: "Weazel News", members: 78, status: "online", color: "bg-green-500" },
  { name: "Detectives", members: 45, status: "online", color: "bg-green-500" },
];

export function ServerStatus() {
  const { data: servers } = useQuery({
    queryKey: ["/api/servers"],
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "online": return "Онлайн";
      case "delay": return "Задержка";
      case "offline": return "Офлайн";
      default: return "Неизвестно";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-400";
      case "delay": return "text-yellow-400";
      case "offline": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <Card className="surface border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Статус серверов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {serverStatuses.map((server, index) => (
            <div key={index} className="flex items-center justify-between p-3 surface-light rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${server.color} rounded-full`} />
                <div>
                  <p className="font-medium text-white">{server.name}</p>
                  <p className="text-sm text-gray-400">{server.members} участников</p>
                </div>
              </div>
              <span className={`text-sm ${getStatusColor(server.status)}`}>
                {getStatusText(server.status)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
