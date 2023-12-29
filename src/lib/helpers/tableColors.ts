//helper functions
export function calculateWinPercentageClasses(win_percentage: number) {
	//console.log(win_percentage)
	let classes = '';
	if (win_percentage < 0.4) classes = 'text-red-800 vibrating font-bold';
	else if (win_percentage < 0.45) classes = 'text-red-700';
	else if (win_percentage <= 0.465) classes = 'text-red-600';
	else if (win_percentage <= 0.49) classes = 'text-red-500';

	if (win_percentage >= 0.51) classes = 'dark:text-green-300 text-green-700';
	if (win_percentage >= 0.535) classes = 'font-bold text-green-500';
	if (win_percentage >= 0.58) classes = 'text-amber-500 animate-pulse';

	return classes;
}

export function calculateKdaClasses(kda: number) {
	//console.log(kda)
	let classes = '';
	if (kda < 3) classes = 'text-red-600';
	if (kda <= 4) classes = 'text-red-400';
	if (kda >= 5) classes = 'dark:text-green-300 text-green-700';
	if (kda >= 6) classes = 'font-bold text-green-500';

	return classes;
}
