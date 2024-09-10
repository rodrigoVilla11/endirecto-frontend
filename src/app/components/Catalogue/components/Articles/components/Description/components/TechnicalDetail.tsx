import { useGetTechnicalDetailByIdQuery } from '@/redux/services/technicalDetails';
import React from 'react'

const TechnicalDetail = ({technical_detail_id} : any) => {

  const { data, error, isLoading } = useGetTechnicalDetailByIdQuery({ id: technical_detail_id });
  return (
    <div>{data?.name}</div>
  )
}

export default TechnicalDetail