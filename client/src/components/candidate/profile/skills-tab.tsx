import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Star, Code, Users, Briefcase, Award, TrendingUp } from "lucide-react";

interface CandidateSkillsTabProps {
  candidateId: string;
}

const SKILL_CATEGORIES = {
  technical: { label: "Technical", icon: Code, color: "bg-blue-100 text-blue-800" },
  soft: { label: "Soft Skills", icon: Users, color: "bg-green-100 text-green-800" },
  domain: { label: "Domain", icon: Briefcase, color: "bg-purple-100 text-purple-800" },
};

const PROFICIENCY_LEVELS = {
  1: { label: "Beginner", color: "bg-red-100 text-red-800" },
  2: { label: "Basic", color: "bg-orange-100 text-orange-800" },
  3: { label: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
  4: { label: "Advanced", color: "bg-blue-100 text-blue-800" },
  5: { label: "Expert", color: "bg-green-100 text-green-800" },
};

export function CandidateSkillsTab({ candidateId }: CandidateSkillsTabProps) {
  const { data: candidateSkills = [], isLoading } = useQuery({
    queryKey: ['/api/candidates', candidateId, 'skills'],
    enabled: !!candidateId,
  });

  const renderStars = (proficiency: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <Star
            key={level}
            className={`h-4 w-4 ${
              level <= proficiency
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const groupedSkills = candidateSkills.reduce((acc: any, skill: any) => {
    if (!acc[skill.skillCategory]) acc[skill.skillCategory] = [];
    acc[skill.skillCategory].push(skill);
    return acc;
  }, {});

  const getTotalSkillsByCategory = (category: string) => {
    return groupedSkills[category]?.length || 0;
  };

  const getAverageProficiency = (category: string) => {
    const skills = groupedSkills[category] || [];
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum: number, skill: any) => sum + skill.proficiency, 0);
    return Math.round(total / skills.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skills Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(SKILL_CATEGORIES).map(([category, config]) => {
          const IconComponent = config.icon;
          const skillCount = getTotalSkillsByCategory(category);
          const avgProficiency = getAverageProficiency(category);
          
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <Badge variant="secondary">{skillCount}</Badge>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Proficiency</span>
                    <span>{avgProficiency}/5</span>
                  </div>
                  <Progress value={(avgProficiency / 5) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Skills by Category */}
      {Object.entries(groupedSkills).map(([category, skills]: [string, any]) => {
        const categoryConfig = SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES];
        const IconComponent = categoryConfig?.icon || Code;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="w-5 h-5" />
                {categoryConfig?.label || category} Skills
                <Badge variant="outline">{skills.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill: any) => (
                  <div
                    key={skill.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{skill.skillName}</h3>
                        {skill.certified && (
                          <Award className="w-4 h-4 text-green-500" title="Certified" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Proficiency</span>
                          <Badge className={PROFICIENCY_LEVELS[skill.proficiency as keyof typeof PROFICIENCY_LEVELS]?.color}>
                            {PROFICIENCY_LEVELS[skill.proficiency as keyof typeof PROFICIENCY_LEVELS]?.label}
                          </Badge>
                        </div>
                        {renderStars(skill.proficiency)}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Experience</span>
                        <span className="font-medium">
                          {skill.yearsOfExperience || 0} years
                        </span>
                      </div>
                      
                      {skill.certified && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <Award className="w-3 h-3" />
                          <span>Certified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {skills.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No {categoryConfig?.label.toLowerCase()} skills added yet.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {candidateSkills.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Skills Added</h3>
            <p className="text-muted-foreground">
              This candidate hasn't added any skills to their profile yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}