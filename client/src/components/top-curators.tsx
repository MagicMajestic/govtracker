import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Curator } from "@shared/schema";

export function TopCurators() {
  const { data: curators } = useQuery<Curator[]>({
    queryKey: ["/api/curators"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/curator-stats"],
  });

  // Combine curator data with stats for display
  const topCurators = curators?.slice(0, 3).map((curator, index) => ({
    ...curator,
    score: [847, 723, 692][index] || 0, // Mock scores for now
    avatar: curator.name.charAt(0).toUpperCase(),
    color: index === 0 ? "bg-blue-600" : index === 1 ? "bg-green-500" : "bg-orange-500",
  })) || [];

  return (
    <Card className="surface border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Топ кураторы</CardTitle>
        <Button variant="ghost" className="text-blue-400 hover:text-blue-300 text-sm p-0">
          Показать всех
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCurators.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Нет данных о кураторах</p>
          ) : (
            topCurators.map((curator, index) => (
              <div key={curator.id} className="flex items-center justify-between p-4 surface-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${curator.color} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {curator.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-white">{curator.name}</p>
                    <p className="text-sm text-gray-400">{curator.faction}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{curator.score}</p>
                  <p className="text-xs text-gray-400">очков</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
