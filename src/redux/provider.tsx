'use client'
import React from 'react'
import {Provider} from 'react-redux'
import { store } from './store'
import "../app/i18n/i18n";


interface Props { 
  children: React.ReactNode
}

export function Providers({children} : Props){
  return <Provider store={store}>
    {children}
  </Provider>
}