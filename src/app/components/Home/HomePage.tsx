import React from 'react'
import SliderImages from './components/SliderImages'
import SliderBrands from './components/SliderBrands/SliderBrands'
import ButtonsImage from './components/ButtonsImage'
import SliderArticles from './components/SliderArticles/SliderArticles'
import BannerInfo from './components/BannerInfo'
import Footer from './components/Footer'


const HomePage = () => {
  return (
    <div>
        <SliderImages />
        <SliderBrands />
        <div className='flex justify-evenly items-center'>
            <ButtonsImage />
            <ButtonsImage />
            <ButtonsImage />
            <ButtonsImage />
        </div>
        <SliderArticles />
        <BannerInfo />
        <Footer />
    </div>
  )
}

export default HomePage