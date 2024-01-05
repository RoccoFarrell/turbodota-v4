import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

function daysAgoString(inputDate: Date | null) {
    return inputDate ? dayjs(inputDate).fromNow() : "-"
}

export default daysAgoString