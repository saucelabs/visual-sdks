// Runs when the SDK loads, before the first test, so every snapshot gets its test's names.
// This is in C because Swift can't run code at load time.
#include "include/SauceVisualLoader.h"

__attribute__((constructor))
static void SauceVisualLoad(void) {
    SauceVisualRegisterTestObservers();
}
