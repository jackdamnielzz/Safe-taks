"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { FormField } from "../ui/FormField";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";

interface ExampleFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    email: string;
    projectName: string;
  }) => Promise<void>;
  initialData?: Partial<{
    title: string;
    description: string;
    email: string;
    projectName: string;
  }>;
}

export const ExampleForm: React.FC<ExampleFormProps> = ({ onSubmit, initialData }) => {
  const t = useTranslations();

  // Define Zod schema for form validation with translated messages
  const exampleFormSchema = z.object({
    title: z.string().min(3, t("form.validation.titleMin")).max(100, t("form.validation.titleMax")),
    description: z.string().min(10, t("form.validation.descriptionMin")),
    email: z.string().email(t("form.validation.invalidEmail")),
    projectName: z.string().min(2, t("form.validation.projectNameRequired")),
  });

  type ExampleFormData = z.infer<typeof exampleFormSchema>;

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
      <h2 className="text-2xl font-bold mb-6">{t("form.exampleTitle")}</h2>

      <FormField
        id="title"
        label={t("wizard.titleLabel")}
        placeholder={t("wizard.titlePlaceholder")}
        register={register}
        error={errors.title}
        required
      />

      <FormField
        id="projectName"
        label={t("form.projectNameLabel")}
        placeholder={t("form.projectNamePlaceholder")}
        register={register}
        error={errors.projectName}
        required
      />

      <FormField
        id="email"
        label={t("form.emailLabel")}
        type="email"
        placeholder={t("form.emailPlaceholder")}
        register={register}
        error={errors.email}
        required
      />

      <TextArea
        id="description"
        label={t("form.descriptionLabel")}
        placeholder={t("form.descriptionPlaceholder")}
        register={register}
        error={errors.description}
        required
        rows={6}
      />

      <div className="flex gap-4 mt-6">
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {t("form.submit")}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={isSubmitting}>
          {t("form.reset")}
        </Button>
      </div>
    </form>
  );
};
