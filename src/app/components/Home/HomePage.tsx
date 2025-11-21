import React from 'react'
import SliderImages from './components/SliderImages'
import SliderBrands from './components/SliderBrands/SliderBrands'
import SliderTags from './components/TagsSlider/TagsSlider'
import SliderArticles from './components/SliderArticles/SliderArticles'
import BannerInfo from './components/BannerInfo'
import Footer from './components/Footer'

const HomePage = () => {
  return (
    <div className='w-full flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-white'>
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