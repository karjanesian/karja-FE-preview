/** Penghitung request API yang sedang berjalan — untuk indikator loading global. */
class ApiLoading {
	count = $state(0);

	get active(): boolean {
		return this.count > 0;
	}

	start(): void {
		this.count += 1;
	}

	done(): void {
		this.count = Math.max(0, this.count - 1);
	}
}

export const apiLoading = new ApiLoading();
