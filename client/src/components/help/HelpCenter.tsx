import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  Mail, 
  Users, 
  Search,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { helpContent, type HelpModule, type HelpStep } from './helpContent';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule?: string;
}

export function HelpCenter({ isOpen, onClose, currentModule }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>(
    currentModule || 'interviews'
  );

  // Reset to current module when dialog opens
  useEffect(() => {
    if (isOpen && currentModule) {
      setSelectedModule(currentModule);
    }
  }, [isOpen, currentModule]);

  // Filter modules based on search
  const filteredModules = Object.keys(helpContent).filter(module =>
    helpContent[module].title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    helpContent[module].introduction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentHelp = helpContent[selectedModule];

  const getStepIcon = (index: number) => {
    const icons = [CheckCircle, ArrowRight, AlertCircle, Users, Mail, Info];
    const Icon = icons[index % icons.length];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <div className="flex h-[80vh]">
          {/* Sidebar - Module List */}
          <div className="w-80 border-r bg-muted/20 p-4">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Help Center
              </DialogTitle>
            </DialogHeader>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-help-search"
              />
            </div>

            {/* Module List */}
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="space-y-2">
                {filteredModules.map((moduleKey) => {
                  const module = helpContent[moduleKey];
                  return (
                    <Button
                      key={moduleKey}
                      variant={selectedModule === moduleKey ? "default" : "ghost"}
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => setSelectedModule(moduleKey)}
                      data-testid={`button-help-module-${moduleKey}`}
                    >
                      <div className="flex items-center gap-3">
                        <module.icon className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {module.introduction.substring(0, 60)}...
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <ScrollArea className="h-full">
              {currentHelp && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <currentHelp.icon className="h-8 w-8 text-primary mt-1" />
                    <div>
                      <h1 className="text-2xl font-bold">{currentHelp.title}</h1>
                      <Badge variant="secondary" className="mt-2">
                        {currentHelp.category}
                      </Badge>
                    </div>
                  </div>

                  {/* A) Introduction */}
                  <section data-testid="help-introduction">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      What is this module for?
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentHelp.introduction}
                    </p>
                  </section>

                  <Separator />

                  {/* B) Step-by-Step Actions */}
                  <section data-testid="help-steps">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      How to use it (Step-by-Step)
                    </h2>
                    <div className="space-y-4">
                      {currentHelp.steps.map((step: HelpStep, index: number) => (
                        <div key={index} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {getStepIcon(index)}
                          </div>
                          <div>
                            <h3 className="font-medium mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {step.description}
                            </p>
                            {step.details && (
                              <div className="text-xs bg-background p-2 rounded border">
                                <strong>Details:</strong> {step.details}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* C) Impact */}
                  <section data-testid="help-impact">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      What happens after each action?
                    </h2>
                    <div className="space-y-3">
                      {currentHelp.impact.map((impact: string, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                          <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm">{impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* D) Workflow */}
                  <section data-testid="help-workflow">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      End-to-End Workflow
                    </h2>
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 p-4 rounded-lg">
                      <div className="flex flex-wrap items-center gap-2">
                        {currentHelp.workflow.map((step: string, index: number) => (
                          <React.Fragment key={index}>
                            <Badge variant="outline" className="px-3 py-1">
                              {step}
                            </Badge>
                            {index < currentHelp.workflow.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* E) Integration Points */}
                  <section data-testid="help-integrations">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      How it connects to other modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentHelp.integrations.map((integration: string, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm">{integration}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* F) Notifications */}
                  <section data-testid="help-notifications">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email notifications & alerts
                    </h2>
                    <div className="space-y-3">
                      {currentHelp.notifications.map((notification: string, index: number) => (
                        <div key={index} className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border-l-4 border-yellow-500">
                          <Mail className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                          <p className="text-sm">{notification}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Context-aware help button component
interface HelpButtonProps {
  module: string;
  className?: string;
}

export function HelpButton({ module, className = "" }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 ${className}`}
        data-testid={`button-help-${module}`}
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </Button>
      
      <HelpCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        currentModule={module}
      />
    </>
  );
}