"use client";
import React, { useEffect, useState } from "react";
import {
  useGetFaqByIdQuery,
  useUpdateFaqMutation,
} from "@/redux/services/faqsApi";
import { useTranslation } from "react-i18next";

type UpdateFaqComponentProps = {
  faqId: string;
  closeModal: () => void;
};

const UpdateFaqComponent = ({ faqId, closeModal }: UpdateFaqComponentProps) => {
  const { t } = useTranslation();
  const { data: faq, error, isLoading } = useGetFaqByIdQuery({ id: faqId });
  const [updateFaq, { isLoading: isUpdating, isSuccess, isError }] =
    useUpdateFaqMutation();
  const [form, setForm] = useState({
    _id: "",
    question: "",
    answer: "",
  });
  
  useEffect(() => {
    if (faq) {
      setForm({
        _id: faq._id,
        question: faq.question ?? "",
        answer: faq.answer ?? "",
      });
    }
  }, [faq]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateFaq(form).unwrap();
      closeModal();
    } catch (err) {
      console.error(t("updateFaq.error"), err);
    }
  };

  if (isLoading) return <p>{t("updateFaq.loading")}</p>;
  if (error) return <p>{t("updateFaq.fetchError")}</p>;

  return (
    <div>
      <h2 className="text-lg mb-4">{t("updateFaq.title")}</h2>
      <form className="flex flex-col gap-4" onSubmit={handleUpdate}>
        <label className="flex flex-col">
          {t("updateFaq.questionLabel")}:
          <textarea
            name="question"
            value={form.question}
            onChange={handleChange}
            className="border border-black rounded-md w-96 h-40 p-2"
          />
        </label>
        <label className="flex flex-col">
          {t("updateFaq.answerLabel")}:
          <textarea
            name="answer"
            value={form.answer}
            onChange={handleChange}
            className="border border-black rounded-md w-96 h-40 p-2"
          />
        </label>
        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            {t("updateFaq.cancel")}
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${
              isUpdating ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isUpdating}
          >
            {isUpdating ? t("updateFaq.updating") : t("updateFaq.update")}
          </button>
        </div>
        {isSuccess && (
          <p className="text-green-500">{t("updateFaq.success")}</p>
        )}
        {isError && <p className="text-red-500">{t("updateFaq.error")}</p>}
      </form>
    </div>
  );
};

export default UpdateFaqComponent;
