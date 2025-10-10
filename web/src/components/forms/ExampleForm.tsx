"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "../ui/FormField";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";

// Define Zod schema for form validation
const exampleFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  projectName: z.string().min(2, "Project name is required"),
});

type ExampleFormData = z.infer<typeof exampleFormSchema>;

interface ExampleFormProps {
  onSubmit: (data: ExampleFormData) => Promise<void>;
  initialData?: Partial<ExampleFormData>;
}

export const ExampleForm: React.FC<ExampleFormProps> = ({ onSubmit, initialData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleFormSchema),
    defaultValues: initialData,
  });

  const onSubmitHandler = async (data: ExampleFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Example Form with Validation</h2>

      <FormField
        id="title"
        label="Title"
        placeholder="Enter a title"
        register={register}
        error={errors.title}
        required
      />

      <FormField
        id="projectName"
        label="Project Name"
        placeholder="Enter project name"
        register={register}
        error={errors.projectName}
        required
      />

      <FormField
        id="email"
        label="Email Address"
        type="email"
        placeholder="your.email@example.com"
        register={register}
        error={errors.email}
        required
      />

      <TextArea
        id="description"
        label="Description"
        placeholder="Enter a detailed description..."
        register={register}
        error={errors.description}
        required
        rows={6}
      />

      <div className="flex gap-4 mt-6">
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          Submit
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={isSubmitting}>
          Reset
        </Button>
      </div>
    </form>
  );
};
