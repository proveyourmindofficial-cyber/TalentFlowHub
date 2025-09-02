import type { Express } from "express";
import { db } from "../db";
import { skills, candidateSkills } from "@shared/schema";
import { eq, like } from "drizzle-orm";
import { z } from "zod";

export function registerSkillsRoutes(app: Express) {
  // Get all skills
  app.get("/api/skills", async (req, res) => {
    try {
      const allSkills = await db.select().from(skills).where(eq(skills.isActive, true));
      res.json(allSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ message: "Failed to fetch skills" });
    }
  });

  // Search skills by name or category
  app.get("/api/skills/search", async (req, res) => {
    try {
      const { q, category } = req.query;
      
      let query = db.select().from(skills).where(eq(skills.isActive, true));
      
      if (q && typeof q === "string") {
        query = query.where(like(skills.name, `%${q}%`));
      }
      
      if (category && typeof category === "string") {
        query = query.where(eq(skills.category, category));
      }
      
      const searchResults = await query;
      res.json(searchResults);
    } catch (error) {
      console.error("Error searching skills:", error);
      res.status(500).json({ message: "Failed to search skills" });
    }
  });

  // Create new skill
  app.post("/api/skills", async (req, res) => {
    try {
      const skillSchema = z.object({
        name: z.string().min(1, "Skill name is required"),
        category: z.enum(["technical", "soft", "domain"]),
        defaultProficiency: z.number().min(1).max(5).default(1),
      });

      const validatedData = skillSchema.parse(req.body);
      
      const [newSkill] = await db
        .insert(skills)
        .values({
          ...validatedData,
          isActive: true,
        })
        .returning();

      res.status(201).json(newSkill);
    } catch (error) {
      console.error("Error creating skill:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  // Get candidate skills
  app.get("/api/candidates/:candidateId/skills", async (req, res) => {
    try {
      const { candidateId } = req.params;
      
      const candidateSkillsList = await db
        .select({
          id: candidateSkills.id,
          skillId: candidateSkills.skillId,
          proficiency: candidateSkills.proficiency,
          yearsOfExperience: candidateSkills.yearsOfExperience,
          certified: candidateSkills.certified,
          addedAt: candidateSkills.addedAt,
          skillName: skills.name,
          skillCategory: skills.category,
        })
        .from(candidateSkills)
        .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
        .where(eq(candidateSkills.candidateId, candidateId));

      res.json(candidateSkillsList);
    } catch (error) {
      console.error("Error fetching candidate skills:", error);
      res.status(500).json({ message: "Failed to fetch candidate skills" });
    }
  });

  // Add skill to candidate
  app.post("/api/candidates/:candidateId/skills", async (req, res) => {
    try {
      const { candidateId } = req.params;
      
      const candidateSkillSchema = z.object({
        skillId: z.string(),
        proficiency: z.number().min(1).max(5),
        yearsOfExperience: z.number().default(0),
        certified: z.boolean().default(false),
      });

      const validatedData = candidateSkillSchema.parse(req.body);
      
      const [newCandidateSkill] = await db
        .insert(candidateSkills)
        .values({
          candidateId,
          ...validatedData,
        })
        .returning();

      res.status(201).json(newCandidateSkill);
    } catch (error) {
      console.error("Error adding skill to candidate:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid candidate skill data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add skill to candidate" });
    }
  });

  // Remove skill from candidate
  app.delete("/api/candidates/:candidateId/skills/:skillId", async (req, res) => {
    try {
      const { candidateId, skillId } = req.params;
      
      await db
        .delete(candidateSkills)
        .where(
          eq(candidateSkills.candidateId, candidateId) && 
          eq(candidateSkills.skillId, skillId)
        );

      res.status(204).send();
    } catch (error) {
      console.error("Error removing skill from candidate:", error);
      res.status(500).json({ message: "Failed to remove skill from candidate" });
    }
  });
}