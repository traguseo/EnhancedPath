/**
 * @description       EnhancedPath
 * @author            Tyler
 * @date              3/3/2026
 * @notes             Any notes / relevant updates to be aware of
 **/

public with sharing class MockEnhancedPathCallable implements System.Callable {
    public Object call(String methodName, Object input) {
        return new Map<String, Object>{ 'isSuccess' => true };
    }
}
