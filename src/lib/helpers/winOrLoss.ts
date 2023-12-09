function winOrLoss(slot: number, win: boolean) {
    if (slot > 127) {
        if (win === false) {
            return true;
        } else return false;
    } else {
        if (win === false) {
            return false;
        } else return true;
    }
}

export default winOrLoss