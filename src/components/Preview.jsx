import React from 'react';
import { StyleRoot } from 'radium';
import GIFEncoder from 'gif-encoder';
import blobStream from 'blob-stream';
import {
  generatePixelDrawCss,
  generateAnimationCSSData
} from '../utils/cssParse';
import Animation from './Animation';

const Preview = (props) => {
  const generatePreview = () => {
    const { activeFrameIndex, duration } = props;
    const {
      frames, columns, cellSize, animate
    } = props.storedData || props;
    const animation = frames.size > 1 && animate;
    let animationData;
    let cssString;

    const styles = {
      previewWrapper: {
        height: cellSize,
        width: cellSize
      }
    };

    if (animation) {
      animationData = generateAnimationCSSData(frames, columns, cellSize);
    } else {
      cssString = generatePixelDrawCss(
        frames.get(activeFrameIndex),
        columns, cellSize, 'string'
      );

      styles.previewWrapper.boxShadow = cssString;
      styles.previewWrapper.MozBoxShadow = cssString;
      styles.previewWrapper.WebkitBoxShadow = cssString;
    }

    return (
      <div style={animation ? null : styles.previewWrapper}>
        {animation ?
          <StyleRoot>
            <Animation
              duration={duration}
              boxShadow={animationData}
            />
          </StyleRoot>
          : null
        }
      </div>
    );
  };

  const generateCanvasPreview = () => {
    const canvasStyle = {
      position: 'fixed',
      left: 40,
    };

    const {
      frames, columns, rows, cellSize,
    } = props.storedData || props;

    const width = columns * cellSize;
    const height = rows * cellSize;

    const renderFrameToCanvas = (canvas, frame) => {
      const ctx = canvas.getContext('2d');
      ctx.canvas.width = width;
      ctx.canvas.height = height;

      const grids = frame.get('grid');
      for (let i = 0, x = 0, y = 0; i < grids.size; i += 1) {
        ctx.fillStyle = grids.get(i);
        ctx.fillRect(x, y, cellSize, cellSize);

        x += cellSize;
        if (i % columns === columns - 1) {
          y += cellSize;
          x = 0;
        }
      }

      return ctx.getImageData(0, 0, width, height).data;
    };

    const renderFrames = () => {
      const canvas = document.createElement('canvas');

      const gif = new GIFEncoder(width, height);
      gif.pipe(blobStream())
        .on('finish', function () {
          const blobURL = this.toBlobURL();
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobURL;
          a.setAttribute('download', 'hello.gif');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => {
            window.URL.revokeObjectURL(blobURL);
          }, 100);
        });

      gif.writeHeader();
      frames.forEach((frame) => {
        gif.addFrame(renderFrameToCanvas(canvas, frame));
        gif.setDelay(frame.get('duration'));
      });
      gif.finish();
    };

    return (
      <div style={canvasStyle}>
        <button onClick={renderFrames}>download gif</button>
      </div>
    );
  };

  const { columns, rows, cellSize } = props.storedData || props;
  const style = {
    width: columns * cellSize,
    height: rows * cellSize
  };

  return (
    <div className="preview" style={style}>
      {generateCanvasPreview()}
      {generatePreview()}
    </div>
  );
};
export default Preview;
