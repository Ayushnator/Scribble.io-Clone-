import './App.css';

interface WordOption {
  word: string;
  category: string;
}

interface WordSelectionProps {
  options: (WordOption | string)[];
  onSelect: (word: string) => void;
}

function WordSelection({ options, onSelect }: WordSelectionProps) {
  const normalizeOption = (option: WordOption | string) => {
    if (typeof option === 'string') {
      return { word: option, category: 'unknown' };
    }
    return option;
  };

  return (
    <div className="word-selection-overlay">
      <div className="word-selection">
        <h2>Choose a word to draw!</h2>
        <div className="word-options">
          {options.map((option, index) => {
            const { word, category } = normalizeOption(option);
            return (
              <button
                key={index}
                className="word-option"
                onClick={() => onSelect(word)}
                title={`Category: ${category}`}
              >
                <div className="word-text">{word}</div>
                <div className="word-category">{category}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WordSelection;
