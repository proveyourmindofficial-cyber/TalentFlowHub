import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface PrimarySkillDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  onSkillSelect?: (skill: Skill) => void; // For auto-populating Skills & Expertise
  placeholder?: string;
  "data-testid"?: string;
}

export function PrimarySkillDropdown({ 
  value, 
  onValueChange, 
  onSkillSelect,
  placeholder = "Select primary skill", 
  ...props 
}: PrimarySkillDropdownProps) {
  const [open, setOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technical");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch all skills
  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create new skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (newSkill: { name: string; category: string }) => {
      return await apiRequest("/api/skills", {
        method: "POST",
        body: JSON.stringify(newSkill),
      });
    },
    onSuccess: (newSkill: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setOpen(false);
      setNewSkillName("");
      onValueChange(newSkill.name);
      // Auto-populate Skills & Expertise
      if (onSkillSelect) {
        onSkillSelect(newSkill);
      }
    },
  });

  // Filter skills based on search
  const filteredSkills = (skills as Skill[]).filter((skill: Skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group skills by category
  const skillsByCategory = filteredSkills.reduce((acc: Record<string, Skill[]>, skill: Skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  const handleSkillChange = (skillName: string) => {
    onValueChange(skillName);
    // Find the full skill object and pass it for auto-population
    const selectedSkill = (skills as Skill[]).find((skill: Skill) => skill.name === skillName);
    if (selectedSkill && onSkillSelect) {
      onSkillSelect(selectedSkill);
    }
  };

  const handleCreateSkill = () => {
    if (newSkillName.trim()) {
      createSkillMutation.mutate({
        name: newSkillName.trim(),
        category: newSkillCategory,
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select value={value} onValueChange={handleSkillChange}>
          <SelectTrigger {...props} className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category}>
                <div className="px-2 py-1">
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                </div>
                {(categorySkills as Skill[]).map((skill: Skill) => (
                  <SelectItem key={skill.id} value={skill.name}>
                    {skill.name}
                  </SelectItem>
                ))}
              </div>
            ))}
            
            {filteredSkills.length === 0 && searchQuery && (
              <div className="p-4 text-center text-muted-foreground">
                No skills found matching "{searchQuery}"
              </div>
            )}
          </SelectContent>
        </Select>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Primary Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Skill Name</label>
                <Input
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g., React Developer, Data Scientist"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Domain">Domain Knowledge</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateSkill}
                  disabled={!newSkillName.trim() || createSkillMutation.isPending}
                >
                  {createSkillMutation.isPending ? "Adding..." : "Add Skill"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}