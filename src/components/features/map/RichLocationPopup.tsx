'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Clock, Phone, Globe, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Location } from '@/types/map';

interface RichLocationPopupProps {
  location: Location;
  onClose: () => void;
}

const RichLocationPopup: React.FC<RichLocationPopupProps> = ({
  location,
  onClose
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  // Get photos array
  const photos = location.photos && location.photos.length > 0 
    ? location.photos 
    : [];

  // Navigate photos
  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Handle image error
  const handleImageError = (index: number) => {
    setImageError(prev => new Set([...prev, index]));
  };

  // Render star rating
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  // Render price level
  const renderPriceLevel = (priceLevel?: number) => {
    if (!priceLevel) return null;
    
    const symbols = [];
    for (let i = 0; i < 4; i++) {
      symbols.push(
        <span key={i} className={i < priceLevel ? "text-green-600" : "text-gray-300"}>
          $
        </span>
      );
    }
    return symbols;
  };

  // Format opening hours
  const getOpenStatus = () => {
    if (location.isOpen === undefined) return null;
    
    return (
      <div className={`flex items-center space-x-1 text-sm ${location.isOpen ? 'text-green-600' : 'text-red-600'}`}>
        <Clock className="w-4 h-4" />
        <span>{location.isOpen ? 'Open now' : 'Closed'}</span>
      </div>
    );
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-2xl max-w-sm w-full z-20 overflow-hidden">
      {/* Header with photo carousel */}
      <div className="relative h-48 bg-gray-200">
        {photos.length > 0 && !imageError.has(currentPhotoIndex) ? (
          <>
            <Image
              src={photos[currentPhotoIndex]}
              alt={location.name || 'Location photo'}
              fill
              className="object-cover"
              onError={() => handleImageError(currentPhotoIndex)}
              sizes="(max-width: 384px) 100vw, 384px"
            />
            
            {/* Photo navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                {/* Photo indicators */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full p-1.5 hover:bg-opacity-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Popular badge */}
        {location.rating && location.rating >= 4.5 && location.userRatingsTotal && location.userRatingsTotal > 100 && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Popular
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Rating */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">
            {location.name || 'Unknown Location'}
          </h3>
          
          {location.rating && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                {renderStars(location.rating)}
                <span className="text-sm font-medium text-gray-700 ml-1">
                  {location.rating.toFixed(1)}
                </span>
              </div>
              {location.userRatingsTotal && (
                <span className="text-sm text-gray-500">
                  ({location.userRatingsTotal.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {/* Type and Price Level */}
          <div className="flex items-center justify-between">
            {location.type && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                {location.type.replace('_', ' ')}
              </span>
            )}
            
            {location.priceLevel && (
              <div className="flex items-center space-x-1">
                {renderPriceLevel(location.priceLevel)}
              </div>
            )}
          </div>
        </div>

        {/* Address and Status */}
        {location.vicinity && (
          <p className="text-sm text-gray-600 flex items-start space-x-1">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{location.vicinity}</span>
          </p>
        )}

        {/* Opening Status */}
        {getOpenStatus()}

        {/* Contact Information */}
        <div className="flex flex-col space-y-2">
          {location.phoneNumber && (
            <a
              href={`tel:${location.phoneNumber}`}
              aria-label={`Call ${location.phoneNumber}`}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{location.phoneNumber}</span>
            </a>
          )}
          
          {location.website && (
            <a
              href={location.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Visit website</span>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button type="button" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Get Directions
          </button>
          <button type="button" className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichLocationPopup;