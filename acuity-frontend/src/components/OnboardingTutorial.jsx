import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_STEPS = [
  {
    element: '#tour-search-bar',
    popover: {
      title: 'Search Services',
      description: 'Start your journey here by searching for local services in Cabuyao.',
      side: 'bottom',
      align: 'start'
    },
    route: '/'
  },
  {
    element: '#tour-category-track',
    popover: {
      title: 'Browse Categories',
      description: 'Or quickly browse through our daily essential categories.',
      side: 'bottom',
      align: 'start'
    },
    route: '/'
  },
  {
    element: '#tour-featured-heading',
    popover: {
      title: 'Featured Enterprises',
      description: 'Explore the featured and nearest micro-enterprises right from your dashboard.',
      side: 'top',
      align: 'start'
    },
    route: '/home'
  },
  {
    element: '#tour-map-page',
    popover: {
      title: 'Interactive Map',
      description: 'Visually discover all registered stores across the 18 barangays on our interactive map.',
      side: 'center',
      align: 'center'
    },
    route: '/map'
  }
];

// Module-level guard ensures the auto-start logic only ever runs ONCE per session
let globalAutoStartFired = false;

const OnboardingTutorial = ({ startManually, onResetManual }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const driverRef = useRef(null);

  useEffect(() => {
    // Initialize driver
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      steps: TOUR_STEPS.map(step => ({
        element: step.element,
        popover: step.popover
      })),
      onNextClick: () => {
        if (!driverRef.current) return;
        const state = driverRef.current.getState();
        const currentIndex = state.activeIndex;
        const nextIndex = currentIndex + 1;

        if (nextIndex >= TOUR_STEPS.length) {
          try {
            localStorage.setItem('hasSeenTutorial', 'true');
          } catch (e) {}
          driverRef.current.destroy();
          return;
        }

        const nextRoute = TOUR_STEPS[nextIndex].route;

        // If route change is needed
        if (window.location.pathname !== nextRoute) {
          driverRef.current.destroy(); // hide current popover
          navigate(nextRoute);

          // wait for navigation and render
          setTimeout(() => {
            if (driverRef.current) {
              driverRef.current.drive(nextIndex);
              // Force recalculation of popover position in case of layout shifts
              setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
            }
          }, 600);
        } else {
          // Same route
          driverRef.current.moveNext();
        }
      },
      onPopoverRender: (popover, { state }) => {
        // Optional hook if needed
      },
      onDestroyStarted: () => {
        // When user tries to close, or we destroy programmatically
        if (driverRef.current) {
           const state = driverRef.current.getState();
           if (!driverRef.current.hasNextStep()) {
              try { localStorage.setItem('hasSeenTutorial', 'true'); } catch (e) {}
           }
           driverRef.current.destroy();
        }
      },
      onCloseClick: () => {
        try {
          localStorage.setItem('hasSeenTutorial', 'true');
        } catch (e) {}
        if (driverRef.current) driverRef.current.destroy();
      }
    });

    driverRef.current = driverObj;

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (globalAutoStartFired) return;
    globalAutoStartFired = true;

    let hasSeenTutorial = true;
    try {
      hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
    } catch (e) {}

    if (!hasSeenTutorial && driverRef.current) {
      setTimeout(() => {
        if (window.location.pathname !== TOUR_STEPS[0].route) {
          navigate(TOUR_STEPS[0].route, { replace: true });
        }
        setTimeout(() => {
            if (driverRef.current) driverRef.current.drive(0);
        }, 500);
      }, 1000);
    }
  }, [navigate]);

  useEffect(() => {
    if (startManually && driverRef.current) {
      try {
        localStorage.setItem('hasSeenTutorial', 'false');
      } catch (e) {}
      
      if (window.location.pathname !== TOUR_STEPS[0].route) {
        navigate(TOUR_STEPS[0].route);
      }
      setTimeout(() => {
        if (driverRef.current) {
            driverRef.current.drive(0);
        }
        if (onResetManual) onResetManual();
      }, 500);
    }
  }, [startManually, navigate, onResetManual]);

  // Driver.js renders outside the React tree, so we return null here
  return null;
};

export default OnboardingTutorial;
