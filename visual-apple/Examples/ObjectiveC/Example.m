#import <Foundation/Foundation.h>
#if SAUCEVISUAL_SOURCE_PACKAGE
@import SauceVisual;
#else
#import <SauceVisual/SauceVisual-Swift.h>
#endif

// Credentials and region come from SAUCE_USERNAME, SAUCE_ACCESS_KEY, and SAUCE_REGION.
// Completion is always on the main thread. Handle constructor errors separately.
void RunObjectiveCExample(SLVBuildOptions *options, void (^completion)(SLVBuild * _Nullable, NSError * _Nullable)) {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithOptions:options error:&error];
    if (client == nil) {
        dispatch_async(dispatch_get_main_queue(), ^{ completion(nil, error); });
        return;
    }
    [client buildWithCompletion:^(SLVBuild *build, NSError *failure) {
        if (failure != nil) {
            completion(nil, failure);
            return;
        }
        NSLog(@"Sauce Visual build: %@", build.url ?: build.buildId);
        // Call once, after the last test.
        [client finishWithCompletion:completion];
    }];
}
