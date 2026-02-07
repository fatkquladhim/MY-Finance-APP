import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export default function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card h-30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="60%" height="16px" className="mb-2" />
          <Skeleton width="40%" height="24px" />
        </div>
        <Skeleton width="40px" height="40px" className="rounded-xl" />
      </div>
      <Skeleton width="30%" height="16px" />
    </div>
  );
}

export function SkeletonTransaction() {
  return (
    <div className="card h-20 flex items-center gap-4">
      <Skeleton width="40px" height="40px" className="rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton width="50%" height="16px" className="mb-1" />
        <Skeleton width="30%" height="14px" />
      </div>
      <Skeleton width="80px" height="20px" className="shrink-0" />
    </div>
  );
}

export function SkeletonBudget() {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton width="40%" height="18px" className="mb-1" />
          <Skeleton width="60%" height="14px" />
        </div>
        <Skeleton width="60px" height="24px" className="rounded-full" />
      </div>
      <Skeleton width="100%" height="8px" className="rounded-full mb-1" />
      <div className="flex justify-between">
        <Skeleton width="20%" height="12px" />
        <Skeleton width="25%" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonGoal() {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton width="50%" height="20px" className="mb-1" />
          <Skeleton width="60%" height="14px" />
        </div>
        <Skeleton width="60px" height="24px" className="rounded-full" />
      </div>
      <Skeleton width="100%" height="8px" className="rounded-full mb-2" />
      <div className="flex justify-between">
        <Skeleton width="15%" height="12px" />
        <div className="flex gap-3">
          <Skeleton width="60px" height="12px" />
          <Skeleton width="50px" height="12px" />
        </div>
      </div>
    </div>
  );
}
