/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, ChangeEvent, useMemo, useCallback } from 'react';
import { css, keyframes } from '@emotion/react';

interface Entry {
    date: string;
    seconds: number;
    amount: number;
}
const MIN_WAGE = 10030; // 최저시급 (2025년 기준, 원화)
const WORK_HOURS_PER_DAY = 8; // 하루 근무 시간 (8시간)
const MAX_AMOUNT = 100_000_000_000; // 최대 금액 (1000억 원)

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
`;

// Layout styles
type StyleProps = { warning?: boolean };

const container = css`
    font-family: 'Inter', sans-serif;
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    width: 100%;
    max-width: 500px;
    margin: 2rem auto;
    padding: 1rem;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
    animation: ${fadeIn} 0.5s ease-out;

    @media (max-width: 500px) {
        box-shadow: none;
    }
`;
const inputSection = css`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;
const labelStyle = css`
    font-size: 1.25rem;
    color: #444;
    font-weight: 700;
    margin-bottom: 0.5rem;
`;
const suffixStyle = css`
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #888;
    font-size: 1rem;
    pointer-events: none;
`;
const inputStyle = css`
    width: 100%;
    padding: 0.8rem 2rem 0.8rem 1rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    text-align: right;
    &:focus {
        border-color: #1976d2;
        outline: none;
    }
`;
const buttonStyle = css`
    margin-top: 0.5rem;
    padding: 0.8rem;
    background: #1976d2;
    color: #fff;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    &:hover {
        background: #115293;
    }
`;
const resultStyle = ({ warning }: StyleProps) => css`
    font-family: monospace;
    font-size: 1.2rem;
    color: ${warning ? '#d32f2f' : '#333'};
    animation: ${fadeIn} 0.3s ease-in;
`;
const historySection = css`
    max-height: 400px;
    overflow-y: auto;
    & > h2 {
        margin-bottom: 1rem;
        color: #1976d2;
        font-size: 1.1rem;
    }
`;
const entryItem = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
`;
const deleteBtnStyle = css`
    background: none;
    border: none;
    color: #e53935;
    font-size: 1rem;
    cursor: pointer;
    padding: 0;
    margin-left: 0.5rem;
    &:hover {
        color: #b71c1c;
    }
`;

const IntimeWidget: React.FC = () => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [balance, setBalance] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

    const latestDate = useMemo(() => {
        if (entries.length === 0) return '';
        // Find the most recent entry by date
        const sorted = [...entries].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        return sorted[sorted.length - 1].date;
    }, [entries]);

    // Calculate display text (money to time)
    const calcText = useCallback((s: number) => {
        let rem = s;
        const Y = Math.floor(rem / (365 * 24 * 3600));
        rem %= 365 * 24 * 3600;
        const M = Math.floor(rem / (30 * 24 * 3600));
        rem %= 30 * 24 * 3600;
        const D = Math.floor(rem / (24 * 3600));
        rem %= 24 * 3600;
        const H = Math.floor(rem / 3600);
        rem %= 3600;
        const m = Math.floor(rem / 60);
        const sec = rem % 60;
        return `${Y ? Y + '년 ' : ''}${M ? M + '개월 ' : ''}${
            D ? D + '일 ' : ''
        }${H}시간 ${m}분 ${sec}초`;
    }, []);

    const calculatedText = useMemo(() => calcText(seconds), [calcText, seconds]);
    const isWarning = useMemo(() => seconds > 0 && seconds <= 59, [seconds]);

    // Handle input (only update balance, not countdown)
    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/\D/g, '');
        if (+raw > MAX_AMOUNT) raw = MAX_AMOUNT.toString();
        setBalance(raw.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    };

    // Register entry
    const onRegister = () => {
        const date = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19); // 'YYYY-MM-DD HH:MM:SS' (KST)

        const _amount = parseFloat(balance.replace(/,/g, '')) || 0;
        const hrs = _amount / MIN_WAGE;
        const days = hrs / WORK_HOURS_PER_DAY;

        const _seconds = Math.floor(days * 24 * 3600);

        const entry: Entry = {
            date,
            seconds: _seconds,
            amount: _amount,
        };

        setSeconds(_seconds);
        setEntries((prev) => [
            ...prev.filter((e) => e.date.slice(5, 10) !== date.slice(5, 10)),
            entry,
        ]);
    };

    // Delete entry
    const onDelete = (date: string) => {
        setEntries((prev) => prev.filter((e) => e.date !== date));
    };

    // Persist entries in localStorage
    useEffect(() => {
        if (!isInitialized) return; // 초기화 전에는 저장하지 않음
        localStorage.setItem('intimeEntries', JSON.stringify(entries));
    }, [entries, isInitialized]);

    // Countdown interval
    useEffect(() => {
        if (seconds <= 0) return;
        const id = setInterval(() => setSeconds((prev) => Math.max(prev - 1, 0)), 1000);
        return () => clearInterval(id);
    }, [seconds]);

    // Persist current countdown on unload or unmount
    useEffect(() => {
        const handleSave = () => {
            if (!latestDate) return;
            localStorage.setItem(
                'intimeEntries',
                JSON.stringify(entries.map((e) => (e.date === latestDate ? { ...e, seconds } : e)))
            );
        };
        window.addEventListener('beforeunload', handleSave);

        return () => {
            handleSave(); // also save on component unmount
            window.removeEventListener('beforeunload', handleSave);
        };
    }, []);

    // Initialize input and countdown from latest entry
    useEffect(() => {
        if (entries.length > 0) {
            // Find the most recent entry by date
            const sorted = [...entries].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const latest = sorted[sorted.length - 1];
            // Calculate seconds based on latest amount
            const amountNum = latest.amount; // 최근 금액
            const hrs = amountNum / MIN_WAGE; // 시간 단위로 변환
            const daysCalc = hrs / WORK_HOURS_PER_DAY; // 일 단위로 변환

            setBalance(latest.amount.toString());
            setSeconds(Math.floor(daysCalc * 24 * 3600));
        }
    }, [entries]);

    // Initialize entries from localStorage
    useEffect(() => {
        setEntries(() => {
            try {
                const stored = localStorage.getItem('intimeEntries');
                if (stored) {
                    const parsed: Entry[] = JSON.parse(stored);
                    const now = new Date();
                    const latest = parsed.reduce(
                        (a, b) => (new Date(a.date) > new Date(b.date) ? a : b),
                        parsed[0]
                    );
                    const diffSec = Math.floor(
                        (now.getTime() - new Date(latest.date).getTime()) / 1000
                    );
                    console.log(new Date(now.getTime()), new Date(latest.date));
                    console.log(diffSec);
                    const wagePerSec = MIN_WAGE / (WORK_HOURS_PER_DAY * 3600);
                    const _seconds = Math.max(latest.seconds - diffSec, 0);
                    const _amount = Math.floor(Math.max(latest.amount - diffSec * wagePerSec, 0));
                    const updated = parsed.map((e) =>
                        e.date === latest.date
                            ? {
                                  ...e,
                                  seconds: _seconds,
                                  amount: _amount,
                              }
                            : e
                    );
                    setIsInitialized(true);
                    return updated;
                }
                setIsInitialized(true);
                return [];
            } catch {
                setIsInitialized(true);
                return [];
            }
        });
    }, []);

    return (
        <div css={container}>
            <div css={inputSection}>
                <label css={labelStyle}>In Time...</label>
                <div
                    css={css`
                        position: relative;
                    `}
                >
                    <input
                        value={balance}
                        onChange={onChange}
                        placeholder="금액을 입력해주세요."
                        css={inputStyle}
                    />
                    <span css={suffixStyle}>₩</span>
                </div>
                <button onClick={onRegister} css={buttonStyle}>
                    등록
                </button>
                <div css={resultStyle({ warning: isWarning })}>{calculatedText}</div>
            </div>
            <div css={historySection}>
                <h2>기록</h2>
                {[...entries]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((e, i) => (
                        <div key={i} css={entryItem}>
                            <span>
                                {e.date.slice(5, 10)}:{' '}
                                {e.date !== latestDate ? calcText(e.seconds) : calcText(seconds)} (₩
                                {e.amount.toLocaleString()})
                            </span>
                            {e.date !== latestDate && (
                                <button onClick={() => onDelete(e.date)} css={deleteBtnStyle}>
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
};
export default IntimeWidget;
