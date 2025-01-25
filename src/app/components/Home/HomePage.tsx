import React, { useState } from 'react'
import SliderImages from './components/SliderImages'
import SliderBrands from './components/SliderBrands/SliderBrands'
import ButtonsImage from './components/TagsSlider/ButtonsImage'
import SliderArticles from './components/SliderArticles/SliderArticles'
import BannerInfo from './components/BannerInfo'
import Footer from './components/Footer'
import SliderTags from './components/TagsSlider/TagsSlider'


const HomePage = () => {
 
  return (
    <div className='w-full flex flex-col justify-center items-center'>
        <SliderImages />
        <SliderBrands />
        <SliderTags />
        <SliderArticles />
        <BannerInfo />
        <Footer />
    </div>
  )
}

export default HomePage