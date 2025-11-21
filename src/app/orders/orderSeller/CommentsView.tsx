"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronDown, FaChevronRight, FaTrash } from "react-icons/fa";

interface CommentsInputProps {
  comments: string;
  setComments: (value: string) => void;
}

const PREDEFINED_COMMENTS = [
  { id: "1", text: "Pendiente de revisión", emoji: "⏳" },
  { id: "2", text: "Aprobado sin observaciones", emoji: "✅" },
  { id: "3", text: "Requiere modificaciones menores", emoji: "✏️" },
  { id: "4", text: "Rechazado - falta documentación", emoji: "❌" },
  { id: "5", text: "En proceso de validación", emoji: "🔍" },
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
      <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setShowPredefinedComments(!showPredefinedComments)}
          className="w-full p-4 flex justify-between items-center text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="font-bold">{t("comments.predefinedTitle") || "Comentarios predefinidos"}</span>
          </div>
          <div className="text-purple-500 transition-transform duration-300">
            {showPredefinedComments ? (
              <FaChevronDown className="w-4 h-4" />
            ) : (
              <FaChevronRight className="w-4 h-4" />
            )}
          </div>
        </button>
        
        {showPredefinedComments && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-t-2 border-gray-200">
            {PREDEFINED_COMMENTS.length > 0 ? (
              <div className="space-y-2">
                {PREDEFINED_COMMENTS.map((comment) => (
                  <button
                    key={comment.id}
                    onClick={() => addPredefinedComment(comment.text)}
                    className="w-full text-left p-3 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:via-purple-50 hover:to-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-purple-300 hover:shadow-md flex items-center gap-3 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {comment.emoji}
                    </span>
                    <span className="font-medium">{comment.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📝</p>
                <p className="font-medium">{t("comments.noPredefined") || "No hay comentarios predefinidos"}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Textarea */}
      <div className="space-y-3">
        <label htmlFor="comments" className="block text-sm font-bold text-gray-700">
          📝 {t("comments.label") || "Comentarios"}
        </label>
        <div className="relative">
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={6}
            className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none transition-all"
            placeholder={t("comments.placeholder") || "Escribe tus comentarios aquí..."}
          />
          {comments && (
            <div className="absolute bottom-3 right-3 bg-gradient-to-r from-gray-100 to-white px-2 py-1 rounded-lg">
              <span className="text-xs text-gray-500 font-medium">
                {comments.length} caracteres
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Clear Button */}
      {comments && (
        <div className="flex justify-end">
          <button
            onClick={() => setComments("")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-all font-bold text-sm border-2 border-red-300 hover:shadow-md"
          >
            <FaTrash className="w-3 h-3" />
            {t("comments.clearButton") || "Limpiar"}
          </button>
        </div>
      )}
    </div>
  );
}