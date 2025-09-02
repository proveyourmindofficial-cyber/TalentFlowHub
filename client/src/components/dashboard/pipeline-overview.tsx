import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function PipelineOverview() {
  const { data: pipelineStages = [], isLoading } = useQuery({
    queryKey: ['/api/dashboard/pipeline'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="animate-fade-in" data-testid="pipeline-overview">
      <CardHeader>
        <CardTitle>Recruitment Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-6"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-300 h-2 rounded-full w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : pipelineStages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No applications to display in pipeline
          </div>
        ) : (
          <div className="space-y-4">
            {pipelineStages.map((stage, index) => (
              <div key={stage.name} data-testid={`pipeline-stage-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${stage.color} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-900" data-testid={`stage-name-${index}`}>
                    {stage.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-medium" data-testid={`stage-count-${index}`}>
                  {stage.count}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${stage.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${stage.percentage}%` }}
                  data-testid={`stage-progress-${index}`}
                ></div>
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
