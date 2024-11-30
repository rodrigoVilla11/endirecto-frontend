'use client'
import { useCreateFaqMutation } from "@/redux/services/faqsApi";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const CreateFaqComponent = ({closeModal} : any) => {

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [createFaq, { isLoading: isLoadingCreate, isSuccess, isError }] =
    useCreateFaqMutation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFaq({ question, answer }).unwrap();
      closeModal();
    } catch (err) {
      console.error("Error al crear la FAQ:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-lg mb-4">New FAQ</h2>
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 rounded-full h-5 w-5 flex justify-center items-center"
        >
          <IoMdClose />
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col">
          Question:
          <textarea
            value={question}
            placeholder="New Question"
            onChange={(e) => setQuestion(e.target.value)}
            className="border border-black rounded-md w-96 h-40 p-2"
          />
        </label>

        <label className="flex flex-col">
          Answer:
          <textarea
            value={answer}
            placeholder="New Answer"
            onChange={(e) => setAnswer(e.target.value)}
            className="border border-black rounded-md w-96 h-40 p-2"
          />
        </label>

        <div className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-400 rounded-md p-2 text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`rounded-md p-2 text-white ${
              isLoadingCreate ? "bg-gray-500" : "bg-success"
            }`}
            disabled={isLoadingCreate}
          >
            {isLoadingCreate ? "Saving..." : "Save"}
          </button>
        </div>

        {isSuccess && (
          <p className="text-green-500">FAQ created successfully!</p>
        )}
        {isError && <p className="text-red-500">Error creating FAQ</p>}
      </form>
    </div>
  );
};

export default CreateFaqComponent;
