"use client";
import React, { useState, useEffect, useRef } from "react";

import Header from "@/app/components/components/Header";
import Input from "@/app/components/components/Input";
import Modal from "@/app/components/components/Modal";
import Table from "@/app/components/components/Table";
import { useGetBranchesQuery } from "@/redux/services/branchesApi";
import {
  useCountUsersQuery,
  useGetUsersPagQuery,
} from "@/redux/services/usersApi";
import { FaPlus, FaPencil, FaTrashCan } from "react-icons/fa6";
import UpdateUserComponent from "./UpdateUser";
import DeleteUserComponent from "./DeleteUser";
import CreateUserComponent from "./CreateUser";
import PrivateRoute from "@/app/context/PrivateRoutes";
import debounce from "@/app/context/debounce";
import { FaTimes } from "react-icons/fa";

const ITEMS_PER_PAGE = 5;

const Page = () => {
  // Estados básicos
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para modales
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Referencias
  const observerRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Queries de Redux
  const { data: branchData } = useGetBranchesQuery(null);
  const { data: countUsersData } = useCountUsersQuery(null);
  const { data, error, isLoading: isQueryLoading, refetch } = useGetUsersPagQuery({
    page,
    limit: ITEMS_PER_PAGE,
    query: searchQuery,
  });

  // Búsqueda con debounce
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setUsers([]);
    setHasMore(true);
  }, 100);

  // Efecto para cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      if (!isLoading && data && branchData) {
        setIsLoading(true);
        try {
          const result = await refetch().unwrap();
          const newUsers = result?.map((user: any) => {
            const branch = branchData?.find((data) => data.id === user.branch);
            return {
              key: user._id,
              id: user._id,
              name: user.username,
              email: user.email,
              role: user.role,
              branch: branch?.name || "No Branch",
              zone: user.zone || "No Zone",
              edit: (
                <div className="flex justify-center items-center">
                  <FaPencil
                    className="text-center text-lg hover:cursor-pointer hover:text-blue-500"
                    onClick={() => handleModalOpen('update', user._id)}
                  />
                </div>
              ),
              erase: (
                <div className="flex justify-center items-center">
                  <FaTrashCan
                    className="text-center text-lg hover:cursor-pointer hover:text-red-500"
                    onClick={() => handleModalOpen('delete', user._id)}
                  />
                </div>
              ),
            };
          }) || [];

          if (page === 1) {
            setUsers(newUsers);
          } else {
            // Filtrar duplicados
            const uniqueUsers = newUsers.filter(
              (newUser: any) => !users.some(existingUser => existingUser.id === newUser.id)
            );
            setUsers(prev => [...prev, ...uniqueUsers]);
          }
          
          setHasMore(newUsers.length === ITEMS_PER_PAGE);
        } catch (error) {
          console.error('Error loading users:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUsers();
  }, [page, searchQuery, data, branchData]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) {
      observer.observe(currentObserver);
    }

    return () => {
      if (currentObserver) {
        observer.unobserve(currentObserver);
      }
    };
  }, [hasMore, isLoading]);

  // Manejadores de modales
  const handleModalOpen = (type: 'create' | 'update' | 'delete', id?: string) => {
    if (type === 'create') {
      setCreateModalOpen(true);
      return;
    }

    if (id) {
      const encodedId = encodeURIComponent(id);
      setCurrentUserId(encodedId);
      if (type === 'update') {
        setUpdateModalOpen(true);
      } else {
        setDeleteModalOpen(true);
      }
    }
  };

  const handleModalClose = (type: 'create' | 'update' | 'delete') => {
    if (type === 'create') {
      setCreateModalOpen(false);
    } else if (type === 'update') {
      setUpdateModalOpen(false);
    } else {
      setDeleteModalOpen(false);
    }
    setCurrentUserId(null);
    refetch();
  };

  // Reset de búsqueda
  const handleResetSearch = () => {
    setSearchQuery('');
    setPage(1);
    setUsers([]);
    setHasMore(true);
  };

  const tableHeader = [
    { name: "Id", key: "id" },
    { name: "User", key: "user" },
    { name: "Email", key: "email" },
    { name: "Role", key: "role" },
    { name: "Branch", key: "branch" },
    { name: "Zone", key: "zone" },
    { component: <FaPencil className="text-center text-xl" />, key: "edit" },
    { component: <FaTrashCan className="text-center text-xl" />, key: "erase" },
  ];

  const headerBody = {
    buttons: [
      {
        logo: <FaPlus />,
        title: "New",
        onClick: () => handleModalOpen('create'),
      },
    ],
    filters: [
      {
        content: (
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                debouncedSearch(e.target.value)
              }
              className="pr-8"
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleResetSearch}
                aria-label="Clear search"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        ),
      },
    ],
    results: searchQuery
      ? `${users.length} Results`
      : `${countUsersData || 0} Results`,
  };

  if (isQueryLoading && users.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading users. Please try again later.
      </div>
    );
  }

  return (
    <PrivateRoute requiredRoles={["ADMINISTRADOR"]}>
      <div className="flex flex-col gap-4">
        <h3 className="font-bold p-4">USERS</h3>
        <Header headerBody={headerBody} />
        
        {isLoading && users.length === 0 ? (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        ) : (
          <>
            <Table headers={tableHeader} data={users} />
            {isLoading && (
              <div ref={loadingRef} className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </>
        )}

        <div ref={observerRef} className="h-10" />

        <Modal isOpen={isCreateModalOpen} onClose={() => handleModalClose('create')}>
          <CreateUserComponent closeModal={() => handleModalClose('create')} />
        </Modal>

        <Modal isOpen={isUpdateModalOpen} onClose={() => handleModalClose('update')}>
          {currentUserId && (
            <UpdateUserComponent
              userId={currentUserId}
              closeModal={() => handleModalClose('update')}
            />
          )}
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={() => handleModalClose('delete')}>
          {currentUserId && (
            <DeleteUserComponent
              userId={currentUserId}
              closeModal={() => handleModalClose('delete')}
            />
          )}
        </Modal>
      </div>
    </PrivateRoute>
  );
};

export default Page;