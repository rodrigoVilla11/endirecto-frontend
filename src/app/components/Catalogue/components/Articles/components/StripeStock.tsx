import React from 'react'

const StripeStock = ({hasStock}: any) => {
  return (
    <div className='h-4 w-full bg-success font-bold text-white flex justify-center items-center'>
        <p>{hasStock}</p>
    </div>
  )
}

export default StripeStock