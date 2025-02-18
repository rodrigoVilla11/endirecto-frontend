"use client";
import React, { useState } from "react";
import Input from "@/app/components/components/Input";
import { useTranslation } from "react-i18next";

interface CommentsInputProps {
  comments: string;
  setComments: (value: string) => void;
}

const PREDEFINED_COMMENTS = [
  { id: "1", text: "Pendiente de revisión" },
  { id: "2", text: "Aprobado sin observaciones" },
  { id: "3", text: "Requiere modificaciones menores" },
  { id: "4", text: "Rechazado - falta documentación" },
  { id: "5", text: "En proceso de validación" },
];

export function CommentsView({ comments, setComments }: CommentsInputProps) {
  const { t } = useTranslation();
  const [showPredefinedComments, setShowPredefinedComments] = useState(false);

  const addPredefinedComment = (text: string) => {
    const newComment = comments ? `${comments}\n${text}` : text;
    setComments(newComment);
  };

  return (
    <div className="space-y-4">
      {/* Predefined Comments Section */}
      <div className="border-b border-zinc-800">
        <button
          onClick={() => setShowPredefinedComments(!showPredefinedComments)}
          className="w-full p-4 flex justify-between items-center text-white"
        >
          <span>{t("comments.predefinedTitle")}</span>
          <span>{showPredefinedComments ? "▼" : "▶"}</span>
        </button>
        {showPredefinedComments && (
          <div className="p-4 bg-zinc-800">
            {PREDEFINED_COMMENTS.length > 0 ? (
              <div className="space-y-2">
                {PREDEFINED_COMMENTS.map((comment) => (
                  <button
                    key={comment.id}
                    onClick={() => addPredefinedComment(comment.text)}
                    className="w-full text-left p-2 text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                  >
                    {comment.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">{t("comments.noPredefined")}</p>
            )}
          </div>
        )}
      </div>

      {/* Comments Textarea */}
      <div className="space-y-2">
        <label htmlFor="comments" className="block text-sm text-gray-400">
          {t("comments.label")}
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={t("comments.placeholder")}
        />
      </div>

      {/* Clear Button */}
      {comments && (
        <button
          onClick={() => setComments("")}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          {t("comments.clearButton")}
        </button>
      )}
    </div>
  );
}
