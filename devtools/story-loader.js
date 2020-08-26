/**
copied and updated from https://github.com/izhan/storybook-description-loader
will replace once repo accepts pull request + publishes
 */
const babel = require('@babel/core');

function createDescriptionNode(name, description) {
    return babel.types.expressionStatement(
        babel.types.assignmentExpression(
            '=',
            babel.types.memberExpression(babel.types.identifier(name), babel.types.identifier('parameters')),
            babel.types.objectExpression([
                babel.types.objectProperty(
                    babel.types.identifier('docs'),
                    babel.types.objectExpression([
                        babel.types.objectProperty(
                            babel.types.identifier('storyDescription'),
                            babel.types.stringLiteral(description),
                        )
                    ]),
                )
            ]),
        ),
    );
}

function annotateDescriptionPlugin() {
    return {
        visitor: {
            ExportNamedDeclaration(path) {
                if (path.node.leadingComments) {
                    const commentValues = path.node.leadingComments.map((node) => {
                        if (node.type === 'CommentLine') {
                            return node.value.trimLeft();
                        } else if (node.type === 'CommentBlock') {
                            return node.value
                                .split('\n')
                                .map((line) => {
                                    // stripping out the whitespace and * from comment blocks
                                    return line.replace(/^(\s+)?(\*+)?(\s+)?/, '');
                                })
                                .join('\n')
                                .trim();
                        }
                    });
                    const description = commentValues.join('\n');

                    const declaration = path.node.declaration.declarations[0];

                    path.insertAfter(createDescriptionNode(declaration.id.name, description));
                }
            }
        }
    };
}

module.exports = function(source) {

    const output = babel.transformSync(source, {
        plugins: [annotateDescriptionPlugin],
        sourceType: 'module'
    });
    return output.code;
};
