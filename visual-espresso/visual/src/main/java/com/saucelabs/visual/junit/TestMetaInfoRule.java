package com.saucelabs.visual.junit;

import com.saucelabs.visual.utils.TestMetaInfo;

import org.junit.rules.TestRule;
import org.junit.runner.Description;
import org.junit.runners.model.Statement;

public class TestMetaInfoRule implements TestRule {

    @Override
    public Statement apply(Statement base, Description description) {
        return new Statement() {
            @Override
            public void evaluate() throws Throwable {
                String className = description.getTestClass().getName();
                String testName = description.getMethodName();

                try {
                    TestMetaInfo.THREAD_LOCAL.set(new TestMetaInfo(className, testName));
                    base.evaluate();  // Run the test
                } finally {
                    TestMetaInfo.THREAD_LOCAL.remove();
                }
            }
        };
    }
}