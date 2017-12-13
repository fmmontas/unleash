'use strict';

const { Router } = require('express');

const version = 1;
const defaultStratergyName = 'default';
const userWithIdStratergyName = 'userWithId';
const gradualRolloutUserIdStratergyName = 'gradualRolloutUserId';

exports.router = config => {
    const router = Router();
    const { featureToggleStore } = config.stores;

    const featuresByUserFilter = (features, userId) =>
        features.map(feature => {
            const enabled = feature.strategies.some(stratergy => {
                // TODO: Need some null checks but 48hours.

                switch (stratergy.name) {
                    case defaultStratergyName:
                        return feature.enabled;
                    case gradualRolloutUserIdStratergyName:
                        return false; // TODO: Need to check with client on implementation for hash on gradual.
                    case userWithIdStratergyName:
                        return (
                            feature.enabled &&
                            stratergy.parameters.userIds
                                .split(',')
                                .includes(userId)
                        );
                    default:
                        return false;
                }
            });

            return {
                name: feature.name,
                description: feature.description,
                enabled,
                devOnly: feature.devOnly,
                togglable: feature.strategies.some(
                    stratergy => stratergy.name === userWithIdStratergyName
                ),
            };
        });

    router.get('/:userId/features', (req, res) => {
        featureToggleStore.getFeatures().then(features =>
            res.json({
                version,
                features: featuresByUserFilter(features, req.params.userId),
            })
        );
    });

    return router;
};
