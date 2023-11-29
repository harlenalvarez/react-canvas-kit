import { CanvasContainer, canvasTransform } from '@/index';
import { useLayoutEffect, useState } from 'react';
import { ActionContainer } from './ActionContainer';

const Container = () => {
  useLayoutEffect(() => {
    return () => {
      canvasTransform.reset();
    }
  })
  return (
    <>
      <CanvasContainer offsetTop={50}>
        <ActionContainer />
      </CanvasContainer >
    </>
  )

}

export const Home = () => {
  const [page, setPage] = useState('Home');
  return (
    <div>
      <div>
        <button onClick={() => setPage('Home')}>Home</button>
        <button onClick={() => setPage('RM')}>RM</button>
      </div>
      {
        page === 'Home' ?
          <div>Home</div> :
          <Container />
      }
    </div>
  )
}