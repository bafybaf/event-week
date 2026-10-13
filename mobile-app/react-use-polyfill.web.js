// Web platformu için React 'use' hook polyfill
// React 18'de olmayan 'use' hook'unu React 19 API'sine uyumlu hale getirir
// expo-router 5.x'in web'de çalışması için gerekli

import React, { useState, useEffect, useContext } from 'react';

// use hook implementation for web (React 18 compatibility)
export function use(promiseOrContext) {
  // Eğer Promise ise, basit bir promise resolver kullan
  if (promiseOrContext && typeof promiseOrContext.then === 'function') {
    const [state, setState] = useState({
      status: 'pending',
      value: null,
      error: null,
    });

    useEffect(() => {
      let cancelled = false;
      promiseOrContext
        .then(
          (value) => {
            if (!cancelled) {
              setState({ status: 'fulfilled', value, error: null });
            }
          },
          (error) => {
            if (!cancelled) {
              setState({ status: 'rejected', value: null, error });
            }
          }
        );

      return () => {
        cancelled = true;
      };
    }, [promiseOrContext]);

    if (state.status === 'pending') {
      throw promiseOrContext; // Suspense için
    } else if (state.status === 'rejected') {
      throw state.error;
    } else {
      return state.value;
    }
  }

  // Eğer Context ise, useContext kullan
  if (promiseOrContext && typeof promiseOrContext._contextValue !== 'undefined') {
    return useContext(promiseOrContext);
  }

  // Diğer durumlar için context olarak dene
  return useContext(promiseOrContext);
}

