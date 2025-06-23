/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, ChangeEvent } from 'react';
import { css } from '@emotion/react';

interface Entry {
    date: string;
    text: string;
    amount: number;
}

const MIN_WAGE = 10030;
const WORK_HOURS_PER_DAY = 8;
const MAX_AMOUNT = 1_000_000_000_000_000;

const wrapperStyle = css`
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  margin: auto;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
`;

const inputStyle = css`
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  text-align: right;
`;

const buttonStyle = css`
  width: 100%;
  background-color: #22c55e;
  color: white;
  padding: 0.5rem 0;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  cursor: pointer;
  &:hover {
    background-color: #16a34a;
  }
`;

const IntimeWidget: React.FC = () => {
    const defaultEntries: Entry[] = [
        { date: '2025-06-20', text: '2일 4시간 30분 0초', amount: 175525 },
        { date: '2025-06-21', text: '1일 8시간 0분 0초', amount: 106987 },
        { date: '2025-06-22', text: '16시간 0분 0초', amount: 53493 },
    ];

    const [entries, setEntries] = useState<Entry[]>(() => {
        try {
            const stored = localStorage.getItem('intimeEntries');
            return stored ? (JSON.parse(stored) as Entry[]) : defaultEntries;
        } catch {
            return defaultEntries;
        }
    });
    const [balance, setBalance] = useState('');
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        try {
            localStorage.setItem('intimeEntries', JSON.stringify(entries));
        } catch {}
    }, [entries]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        let raw = e.target.value.replace(/[^\d]/g, '');
        if (raw) {
            const num = parseInt(raw, 10);
            if (num > MAX_AMOUNT) raw = MAX_AMOUNT.toString();
        }
        const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setBalance(formatted);

        const amountNum = parseFloat(raw) || 0;
        const totalWorkHours = amountNum / MIN_WAGE;
        const totalLifeDays = totalWorkHours / WORK_HOURS_PER_DAY;
        const totalSec = Math.floor(totalLifeDays * 24 * 3600);
        setRemainingSeconds(totalSec);
    };

    useEffect(() => {
        if (remainingSeconds <= 0) return;
        const id = setInterval(() => {
            setRemainingSeconds(prev => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(id);
    }, [remainingSeconds]);

    const calculateDisplayText = (secs: number): string => {
        let s = secs;
        const years = Math.floor(s / (365 * 24 * 3600)); s %= 365 * 24 * 3600;
        const months = Math.floor(s / (30 * 24 * 3600)); s %= 30 * 24 * 3600;
        const days = Math.floor(s / (24 * 3600)); s %= 24 * 3600;
        const hours = Math.floor(s / 3600); s %= 3600;
        const minutes = Math.floor(s / 60); s %= 60;
        const seconds = s;
        return `${years}년 ${months}개월 ${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
    };

    const displayText = calculateDisplayText(remainingSeconds);

    const formatListText = (text: string): string =>
        text.replace(/^0년\s*/, '').replace(/^0개월\s*/, '').replace(/^0일\s*/, '');

    const handleRegister = (): void => {
        const amountNum = parseFloat(balance.replace(/,/g, '')) || 0;
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0];
        const text = formatListText(calculateDisplayText(remainingSeconds));
        setEntries(prev => {
            const filtered = prev.filter(e => e.date !== dateKey);
            return [...filtered, { date: dateKey, text, amount: amountNum }];
        });
    };

    return (
        <div css={wrapperStyle}>
            <h1 css={css`font-size: 1.25rem; font-weight: bold; text-align: center; margin-bottom: 1rem;`}>
                Intime: 남은 수명 환산기
            </h1>

            <label css={css`display: block; font-size: 0.875rem; margin-bottom: 0.5rem;`}>통장 잔액 (₩):</label>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                value={balance}
                onChange={handleInputChange}
                placeholder="예: 1,000,000"
                css={inputStyle}
            />
            <p css={css`font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem;`}>
                최대 입력 가능 금액: ₩{MAX_AMOUNT.toLocaleString()}
            </p>

            <button onClick={handleRegister} css={buttonStyle}>등록하기</button>

            <div css={css`margin-bottom: 1rem; text-align: center; overflow-x: auto;`}>
                <p css={css`font-size: 1.125rem; white-space: nowrap;`}>
                    남은 수명:{' '}
                    <span
                        css={css`
              font-family: monospace;
              color: ${remainingSeconds <= 59 && remainingSeconds > 0 ? 'red' : 'black'};
            `}
                    >
            {displayText}
          </span>
                </p>
                <p css={css`font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;`}>
                    * 최저시급 {MIN_WAGE.toLocaleString()}원, 하루 {WORK_HOURS_PER_DAY}시간 근무 기준
                </p>
            </div>

            <ul css={css`list-style-type: disc; padding-left: 1rem; overflow-x: auto;`}>
                {entries.map((entry, index) => (
                    <li key={index} css={css`white-space: nowrap;`}>
                        {entry.date} - <span css={css`font-family: monospace; color: black;`}>{entry.text}</span>{' '}
                        (<span css={css`font-family: monospace;`}>₩{entry.amount.toLocaleString()}</span>)
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default IntimeWidget;