import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Gift, TrendingUp, Award } from 'lucide-react'

const LoyaltyCard = ({ user, totalSpent = 0, orderCount = 0 }) => {
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState('Bronze')
  const [nextLevel, setNextLevel] = useState('Silver')
  const [pointsToNext, setPointsToNext] = useState(0)

  useEffect(() => {
    // Calculate points (10 points per KSh 100 spent)
    const calculatedPoints = Math.floor(totalSpent / 10)
    setPoints(calculatedPoints)
    
    // Determine loyalty level
    if (calculatedPoints >= 1000) {
      setLevel('Diamond 💎')
      setNextLevel('Max')
      setPointsToNext(0)
    } else if (calculatedPoints >= 500) {
      setLevel('Gold 🥇')
      setNextLevel('Diamond 💎')
      setPointsToNext(1000 - calculatedPoints)
    } else if (calculatedPoints >= 200) {
      setLevel('Silver 🥈')
      setNextLevel('Gold 🥇')
      setPointsToNext(500 - calculatedPoints)
    } else {
      setLevel('Bronze 🥉')
      setNextLevel('Silver 🥈')
      setPointsToNext(200 - calculatedPoints)
    }
  }, [totalSpent])

  const progress = pointsToNext > 0 ? (points / (points + pointsToNext)) * 100 : 100

  const levelColors = {
    'Bronze 🥉': 'from-amber-600 to-amber-700',
    'Silver 🥈': 'from-gray-400 to-gray-500',
    'Gold 🥇': 'from-yellow-500 to-yellow-600',
    'Diamond 💎': 'from-blue-400 to-cyan-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${levelColors[level] || 'from-amber-500 to-orange-500'} rounded-full flex items-center justify-center`}>
            <Award className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Loyalty Points</h3>
            <p className="text-sm text-gray-500">{level} Member</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-600">{points}</p>
          <p className="text-xs text-gray-500">total points</p>
        </div>
      </div>

      {pointsToNext > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress to {nextLevel}</span>
            <span className="text-amber-600 font-semibold">{pointsToNext} points left</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-lg font-bold text-gray-800">{orderCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Spent</p>
          <p className="text-lg font-bold text-green-600">KSh {totalSpent.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-100 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Gift size={16} />
          <span>Earn 10 points for every KSh 100 spent!</span>
        </div>
      </div>

      <div className="mt-3 p-2 bg-white/50 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <TrendingUp size={12} />
          <span>Redeem points for discounts on your next purchase!</span>
        </div>
      </div>
    </motion.div>
  )
}

export default LoyaltyCard