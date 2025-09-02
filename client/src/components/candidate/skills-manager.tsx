import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X, Star, Code, Users, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Skill {
  id: string;
  name: string;
  category: "technical" | "soft" | "domain";
  proficiency: 1 | 2 | 3 | 4 | 5; // 1=Beginner, 5=Expert
  yearsOfExperience?: number;
  certified?: boolean;
}

interface CandidateSkill extends Skill {
  candidateId: string;
  addedAt: string;
}

interface SkillsManagerProps {
  candidateId?: string;
  selectedSkills: CandidateSkill[];
  onSkillsChange: (skills: CandidateSkill[]) => void;
  readOnly?: boolean;
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

export function SkillsManager({
  candidateId,
  selectedSkills,
  onSkillsChange,
  readOnly = false,
}: SkillsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "technical" as const,
    proficiency: 3 as const,
    yearsOfExperience: 0,
    certified: false,
  });

  const queryClient = useQueryClient();

  // Fetch all available skills from the database
  const { data: availableSkills, isLoading } = useQuery({
    queryKey: ["/api/skills"],
    select: (data) => data || [],
  });

  // Add new skill to the global skills database
  const addSkillMutation = useMutation({
    mutationFn: async (skill: Omit<Skill, "id">) => {
      return await apiRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify(skill),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  const filteredSkills = availableSkills?.filter((skill: Skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    const notAlreadySelected = !selectedSkills.some((s) => s.id === skill.id);
    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const handleAddExistingSkill = (skill: Skill) => {
    const candidateSkill: CandidateSkill = {
      ...skill,
      candidateId: candidateId || "",
      addedAt: new Date().toISOString(),
    };
    onSkillsChange([...selectedSkills, candidateSkill]);
  };

  const handleCreateAndAddSkill = async () => {
    if (!newSkill.name.trim()) return;

    try {
      const createdSkill = await addSkillMutation.mutateAsync(newSkill);
      const candidateSkill: CandidateSkill = {
        ...createdSkill,
        candidateId: candidateId || "",
        addedAt: new Date().toISOString(),
      };
      onSkillsChange([...selectedSkills, candidateSkill]);
      setNewSkill({
        name: "",
        category: "technical",
        proficiency: 3,
        yearsOfExperience: 0,
        certified: false,
      });
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to create skill:", error);
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter((skill) => skill.id !== skillId));
  };

  const handleUpdateSkillProficiency = (skillId: string, proficiency: number) => {
    onSkillsChange(
      selectedSkills.map((skill) =>
        skill.id === skillId ? { ...skill, proficiency: proficiency as 1 | 2 | 3 | 4 | 5 } : skill
      )
    );
  };

  const handleUpdateSkillExperience = (skillId: string, yearsOfExperience: number) => {
    onSkillsChange(
      selectedSkills.map((skill) =>
        skill.id === skillId ? { ...skill, yearsOfExperience } : skill
      )
    );
  };

  const renderStars = (proficiency: number, skillId?: string) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <Star
            key={level}
            className={`h-4 w-4 cursor-pointer ${
              level <= proficiency
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => {
              if (!readOnly && skillId) {
                handleUpdateSkillProficiency(skillId, level);
              }
            }}
          />
        ))}
      </div>
    );
  };

  const groupedSkills = selectedSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, CandidateSkill[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Skills & Expertise
          </span>
          {!readOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="add-skill-button">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skills
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Skills</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                      data-testid="skill-search"
                    />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.entries(SKILL_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Available Skills */}
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                    {isLoading ? (
                      <p>Loading skills...</p>
                    ) : filteredSkills?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No skills found. Create a new one below.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {filteredSkills?.map((skill: Skill) => {
                          const categoryInfo = SKILL_CATEGORIES[skill.category];
                          const CategoryIcon = categoryInfo.icon;
                          
                          return (
                            <div
                              key={skill.id}
                              className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                              onClick={() => handleAddExistingSkill(skill)}
                              data-testid={`skill-option-${skill.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                <span>{skill.name}</span>
                                <Badge className={categoryInfo.color}>
                                  {categoryInfo.label}
                                </Badge>
                              </div>
                              {renderStars(skill.proficiency)}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Create New Skill */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Create New Skill</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Skill name"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        data-testid="new-skill-name"
                      />
                      <Select
                        value={newSkill.category}
                        onValueChange={(value) =>
                          setNewSkill({ ...newSkill, category: value as "technical" | "soft" | "domain" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SKILL_CATEGORIES).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Proficiency:</span>
                        {renderStars(newSkill.proficiency)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Experience:</span>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={newSkill.yearsOfExperience}
                          onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-8"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">years</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleCreateAndAddSkill}
                        disabled={!newSkill.name.trim() || addSkillMutation.isPending}
                        data-testid="create-skill-button"
                      >
                        {addSkillMutation.isPending ? "Creating..." : "Create & Add"}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedSkills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No skills added yet</p>
            {!readOnly && <p className="text-sm">Click "Add Skills" to get started</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(SKILL_CATEGORIES).map(([categoryKey, categoryInfo]) => {
              const categorySkills = groupedSkills[categoryKey] || [];
              if (categorySkills.length === 0) return null;

              const CategoryIcon = categoryInfo.icon;

              return (
                <div key={categoryKey}>
                  <h4 className="flex items-center gap-2 font-medium mb-3">
                    <CategoryIcon className="h-4 w-4" />
                    {categoryInfo.label} ({categorySkills.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categorySkills.map((skill) => {
                      const proficiencyInfo = PROFICIENCY_LEVELS[skill.proficiency] || PROFICIENCY_LEVELS[3];
                      
                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          data-testid={`selected-skill-${skill.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{skill.name}</span>
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSkill(skill.id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  data-testid={`remove-skill-${skill.id}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {renderStars(skill.proficiency, readOnly ? undefined : skill.id)}
                              <Badge className={proficiencyInfo.color} variant="secondary">
                                {proficiencyInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Experience:</span>
                              {readOnly ? (
                                <span className="text-xs font-medium">
                                  {skill.yearsOfExperience || 0} years
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="50"
                                    step="0.5"
                                    value={skill.yearsOfExperience || 0}
                                    onChange={(e) => handleUpdateSkillExperience(skill.id, parseFloat(e.target.value) || 0)}
                                    className="w-16 h-6 text-xs"
                                    data-testid={`skill-experience-${skill.id}`}
                                  />
                                  <span className="text-xs text-muted-foreground">years</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}