import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Star, MapPin, Building, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SearchFilters {
  skills: string[];
  experience: { min: number; max: number };
  location: string;
  company: string;
  availability: string;
  documents: string[];
}

interface SmartCandidateSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onResultSelect: (candidateId: string) => void;
}

export function SmartCandidateSearch({ onSearch, onResultSelect }: SmartCandidateSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    skills: [],
    experience: { min: 0, max: 20 },
    location: "",
    company: "",
    availability: "",
    documents: [],
  });
  
  const { data: skillSuggestions } = useQuery({
    queryKey: ["/api/skills"],
    select: (data) => data?.slice(0, 10) || [],
  });

  const handleSkillAdd = (skill: string) => {
    if (skill && !filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSearch = () => {
    onSearch(searchQuery, filters);
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      experience: { min: 0, max: 20 },
      location: "",
      company: "",
      availability: "",
      documents: [],
    });
    setSearchQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Smart Candidate Search
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, email, skills, or experience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            data-testid="search-input"
          />
          <Button onClick={handleSearch} data-testid="search-button">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Advanced Filters</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Skills Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {skill}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleSkillRemove(skill)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={handleSkillAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Add skills to search..." />
                </SelectTrigger>
                <SelectContent>
                  {skillSuggestions?.map((skill: any) => (
                    <SelectItem key={skill.id} value={skill.name}>
                      {skill.name} ({skill.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Min Experience (years)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={filters.experience.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    experience: { ...prev.experience, min: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Experience (years)</label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={filters.experience.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    experience: { ...prev.experience, max: parseInt(e.target.value) || 20 }
                  }))}
                />
              </div>
            </div>

            {/* Location & Company */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  placeholder="City, State, Country..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Current/Previous Company
                </label>
                <Input
                  placeholder="Company name..."
                  value={filters.company}
                  onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Availability
              </label>
              <Select value={filters.availability} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, availability: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select availability..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (0-15 days)</SelectItem>
                  <SelectItem value="short">Short Notice (15-30 days)</SelectItem>
                  <SelectItem value="medium">Medium Notice (1-2 months)</SelectItem>
                  <SelectItem value="long">Long Notice (2+ months)</SelectItem>
                  <SelectItem value="not_looking">Not Looking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">Required Documents</label>
              <div className="grid grid-cols-2 gap-2">
                {['Resume', 'Government ID', 'Education Certificates', 'Experience Letters'].map((doc) => (
                  <label key={doc} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.documents.includes(doc)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, documents: [...prev.documents, doc] }));
                        } else {
                          setFilters(prev => ({ ...prev, documents: prev.documents.filter(d => d !== doc) }));
                        }
                      }}
                    />
                    <span className="text-sm">{doc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(filters.skills.length > 0 || filters.location || filters.company || filters.availability) && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Active filters:</span>
            {filters.skills.map((skill) => (
              <Badge key={skill} variant="outline">{skill}</Badge>
            ))}
            {filters.location && <Badge variant="outline">📍 {filters.location}</Badge>}
            {filters.company && <Badge variant="outline">🏢 {filters.company}</Badge>}
            {filters.availability && <Badge variant="outline">📅 {filters.availability}</Badge>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}